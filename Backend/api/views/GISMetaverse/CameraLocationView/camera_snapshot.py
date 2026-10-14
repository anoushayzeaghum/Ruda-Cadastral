"""Camera snapshot helpers for GIS Metaverse live-camera downloads.

The CameraLocation table currently stores an iframe URL (``iframe_lin``), not a
raw JPEG URL.  These helpers try several safe strategies, in order:

1. If the configured URL itself returns an image, use it.
2. If it returns HTML, discover image/HLS/MP4 URLs referenced by the page.
3. Use ffmpeg for HLS/MP4 streams when available.
4. Optionally use Playwright/Chromium to render the third-party viewer and
   capture the largest video/canvas/image element.

The public view code always returns a JPEG to the React client.
"""

from __future__ import annotations

import html
import io
import ipaddress
import os
import re
import shutil
import socket
import subprocess
import tempfile
from dataclasses import dataclass
from typing import Iterable, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


DEFAULT_TIMEOUT = int(os.environ.get("CAMERA_SNAPSHOT_HTTP_TIMEOUT", "20"))
BROWSER_WAIT_MS = int(os.environ.get("CAMERA_SNAPSHOT_BROWSER_WAIT_MS", "4500"))
MAX_HTML_BYTES = int(os.environ.get("CAMERA_SNAPSHOT_MAX_HTML_BYTES", str(5 * 1024 * 1024)))
USER_AGENT = os.environ.get(
    "CAMERA_SNAPSHOT_USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
)


class CameraSnapshotError(RuntimeError):
    pass


@dataclass
class SnapshotResult:
    jpeg_bytes: bytes
    source: str
    width: Optional[int] = None
    height: Optional[int] = None


def _reject_unsafe_url(url: str) -> None:
    """Basic SSRF guard for URLs stored in the camera table."""
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise CameraSnapshotError("Camera URL must use http or https.")
    if not parsed.hostname:
        raise CameraSnapshotError("Camera URL has no hostname.")

    host = parsed.hostname.lower()
    if host in {"localhost", "localhost.localdomain"}:
        raise CameraSnapshotError("Local camera URLs are not allowed by this endpoint.")

    # Reject obvious literal private/loopback/link-local addresses. Domain names
    # remain usable for company/VPN camera services.
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise CameraSnapshotError("Private/local IP camera URLs are not allowed.")
    except ValueError:
        pass


def _http_get(url: str, *, referer: Optional[str] = None, max_bytes: Optional[int] = None):
    _reject_unsafe_url(url)
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }
    if referer:
        headers["Referer"] = referer
    request = Request(url, headers=headers)
    try:
        with urlopen(request, timeout=DEFAULT_TIMEOUT) as response:
            content_type = (response.headers.get("Content-Type") or "").split(";", 1)[0].lower()
            data = response.read(max_bytes + 1 if max_bytes else None)
            if max_bytes and len(data) > max_bytes:
                raise CameraSnapshotError("Camera viewer response is too large to inspect safely.")
            return data, content_type, response.geturl()
    except HTTPError as exc:
        raise CameraSnapshotError(f"Camera service returned HTTP {exc.code}.") from exc
    except URLError as exc:
        raise CameraSnapshotError(f"Could not reach camera service: {exc.reason}") from exc
    except TimeoutError as exc:
        raise CameraSnapshotError("Camera service timed out.") from exc


def _is_jpeg(data: bytes, content_type: str = "") -> bool:
    return content_type in {"image/jpeg", "image/jpg"} or data.startswith(b"\xff\xd8\xff")


def _convert_image_to_jpeg(data: bytes) -> bytes:
    if _is_jpeg(data):
        return data

    # Pillow is normally present in geospatial/Django stacks; keep it optional.
    try:
        from PIL import Image

        image = Image.open(io.BytesIO(data)).convert("RGB")
        out = io.BytesIO()
        image.save(out, format="JPEG", quality=95, optimize=True)
        return out.getvalue()
    except Exception:
        pass

    # ffmpeg fallback for PNG/WebP/etc.
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        try:
            proc = subprocess.run(
                [
                    ffmpeg,
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-i",
                    "pipe:0",
                    "-frames:v",
                    "1",
                    "-f",
                    "image2pipe",
                    "-vcodec",
                    "mjpeg",
                    "-q:v",
                    "2",
                    "pipe:1",
                ],
                input=data,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=20,
                check=False,
            )
            if proc.returncode == 0 and _is_jpeg(proc.stdout):
                return proc.stdout
        except Exception:
            pass

    raise CameraSnapshotError(
        "The camera returned an image, but it could not be converted to JPEG. "
        "Install Pillow or ffmpeg on the backend server."
    )


def _candidate_urls(html_text: str, base_url: str) -> list[str]:
    """Extract likely snapshots/streams from the third-party viewer HTML."""
    text = html.unescape(html_text).replace("\\/", "/")
    candidates: list[str] = []

    patterns = [
        r'''(?:src|href|poster)\s*=\s*["']([^"']+)["']''',
        r'''["'](https?://[^"'\s<>]+)["']''',
        r'''["']([^"']+\.(?:jpe?g|png|webp|m3u8|mp4)(?:\?[^"']*)?)["']''',
    ]

    for pattern in patterns:
        for raw in re.findall(pattern, text, flags=re.IGNORECASE):
            raw = raw.strip()
            if not raw or raw.startswith(("data:", "blob:", "javascript:")):
                continue
            absolute = urljoin(base_url, raw)
            if absolute not in candidates:
                candidates.append(absolute)

    def score(url: str) -> tuple[int, int]:
        lower = url.lower()
        priority = 9
        if any(word in lower for word in ("snapshot", "capture", "still", "frame")):
            priority = 0
        elif re.search(r"\.jpe?g(?:\?|$)", lower):
            priority = 1
        elif re.search(r"\.(?:png|webp)(?:\?|$)", lower):
            priority = 2
        elif ".m3u8" in lower:
            priority = 3
        elif ".mp4" in lower:
            priority = 4
        return (priority, len(url))

    return sorted(candidates, key=score)


def _snapshot_from_media_url(url: str, *, referer: Optional[str] = None) -> Optional[SnapshotResult]:
    lower = url.lower()

    if re.search(r"\.(?:jpe?g|png|webp)(?:\?|$)", lower) or any(
        token in lower for token in ("snapshot", "capture", "still", "frame")
    ):
        try:
            data, content_type, final_url = _http_get(url, referer=referer)
            if content_type.startswith("image/") or data.startswith((b"\xff\xd8\xff", b"\x89PNG")):
                return SnapshotResult(_convert_image_to_jpeg(data), final_url)
        except CameraSnapshotError:
            return None

    if ".m3u8" in lower or ".mp4" in lower:
        try:
            return SnapshotResult(_ffmpeg_snapshot(url), url)
        except CameraSnapshotError:
            return None

    return None


def _ffmpeg_snapshot(url: str) -> bytes:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise CameraSnapshotError("ffmpeg is not installed on the backend server.")

    _reject_unsafe_url(url)
    cmd = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-rw_timeout",
        "15000000",
        "-i",
        url,
        "-an",
        "-frames:v",
        "1",
        "-f",
        "image2pipe",
        "-vcodec",
        "mjpeg",
        "-q:v",
        "2",
        "pipe:1",
    ]
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=25,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise CameraSnapshotError("Timed out while extracting a frame with ffmpeg.") from exc

    if proc.returncode != 0 or not _is_jpeg(proc.stdout):
        detail = proc.stderr.decode("utf-8", errors="ignore")[-500:].strip()
        raise CameraSnapshotError(f"ffmpeg could not extract a camera frame. {detail}".strip())
    return proc.stdout


def _playwright_snapshot(viewer_url: str) -> SnapshotResult:
    """Render a JS/WebRTC iframe viewer and capture its largest visual element."""
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise CameraSnapshotError(
            "The camera viewer does not expose a direct image/stream. "
            "Install Playwright on the backend for rendered capture: "
            "pip install playwright && playwright install chromium"
        ) from exc

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--autoplay-policy=no-user-gesture-required",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                ],
            )
            page = browser.new_page(viewport={"width": 1600, "height": 900})
            page.goto(viewer_url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(BROWSER_WAIT_MS)

            # Choose the largest visible media element so the JPEG contains the
            # camera picture rather than the entire browser page whenever possible.
            best = None
            best_area = 0.0
            for selector in ("video", "canvas", "img"):
                locator = page.locator(selector)
                count = min(locator.count(), 30)
                for idx in range(count):
                    element = locator.nth(idx)
                    try:
                        if not element.is_visible():
                            continue
                        box = element.bounding_box()
                        if not box:
                            continue
                        area = float(box["width"]) * float(box["height"])
                        if area > best_area and box["width"] >= 300 and box["height"] >= 180:
                            best = element
                            best_area = area
                    except Exception:
                        continue

            if best is not None:
                jpeg = best.screenshot(type="jpeg", quality=95)
                source = "playwright-media-element"
            else:
                jpeg = page.screenshot(type="jpeg", quality=95, full_page=False)
                source = "playwright-page"

            browser.close()
            if not _is_jpeg(jpeg):
                raise CameraSnapshotError("Rendered camera capture was not a valid JPEG.")
            return SnapshotResult(jpeg, source)
    except CameraSnapshotError:
        raise
    except Exception as exc:
        raise CameraSnapshotError(f"Browser capture failed: {exc}") from exc


def capture_camera_snapshot(viewer_url: str) -> SnapshotResult:
    """Return a JPEG snapshot for a CameraLocation iframe URL."""
    if not viewer_url:
        raise CameraSnapshotError("This camera has no iframe URL configured.")

    _reject_unsafe_url(viewer_url)

    # First inspect the URL without needing a browser.
    try:
        data, content_type, final_url = _http_get(
            viewer_url,
            max_bytes=MAX_HTML_BYTES,
        )

        if content_type.startswith("image/") or _is_jpeg(data, content_type):
            return SnapshotResult(_convert_image_to_jpeg(data), final_url)

        if "mpegurl" in content_type or ".m3u8" in final_url.lower():
            return SnapshotResult(_ffmpeg_snapshot(final_url), final_url)

        if content_type.startswith("video/") or ".mp4" in final_url.lower():
            return SnapshotResult(_ffmpeg_snapshot(final_url), final_url)

        # Inspect HTML/JS for a direct media URL.
        html_text = data.decode("utf-8", errors="ignore")
        for candidate in _candidate_urls(html_text, final_url):
            result = _snapshot_from_media_url(candidate, referer=final_url)
            if result:
                return result
    except CameraSnapshotError:
        # Browser fallback below can still succeed when direct HTTP inspection is
        # blocked or the viewer is entirely client-rendered.
        pass

    return _playwright_snapshot(viewer_url)
