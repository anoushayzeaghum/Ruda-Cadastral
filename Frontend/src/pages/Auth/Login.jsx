import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-950 via-emerald-900 to-slate-950">
      {/* subtle topo/grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gridFade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#93c5fd" stopOpacity="0.35" />
              <stop offset="0.5" stopColor="#34d399" stopOpacity="0.25" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.12" />
            </linearGradient>
            <pattern
              id="grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="url(#gridFade)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="1200" height="800" fill="url(#grid)" />
          <path
            d="M0,560 C180,520 260,620 440,590 C620,560 740,420 940,460 C1060,485 1120,540 1200,510"
            fill="none"
            stroke="rgba(147,197,253,0.45)"
            strokeWidth="2"
            strokeDasharray="10 10"
          />
          <path
            d="M0,300 C240,260 320,360 520,330 C720,300 820,160 1020,200 C1120,220 1160,255 1200,235"
            fill="none"
            stroke="rgba(52,211,153,0.35)"
            strokeWidth="2"
            strokeDasharray="14 12"
          />

          {/* lightweight background motion (SVG animation, no extra CSS needed) */}
          <animate
            attributeName="opacity"
            values="0.55;0.85;0.55"
            dur="7s"
            repeatCount="indefinite"
          />
        </svg>
      </div>

      {/* soft vignette */}
      <div className="pointer-events-none absolute inset-0 bg-black/20" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-10 sm:px-8">
        <div className="grid w-full grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
          {/* LEFT: brand panel */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm lg:p-10">
            {/* decorative blobs */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-300/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-emerald-300/15 blur-2xl" />
            <div className="flex justify-center">
              <div className="rounded-full bg-white p-2 shadow-sm">
                <img
                  src={rudaFirmLogo}
                  alt="RUDA"
                  className="h-20 w-20 object-contain sm:h-24 sm:w-24"
                />
              </div>
            </div>

            <div className="mt-8 space-y-4 text-center">
              <h1 className="mx-auto max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
                Cadastral Management{" "}
                <span className="block text-sky-200">made simple.</span>
              </h1>

              <p className="mx-auto max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                Secure access to cadastral parcels, spatial records, and land
                management tools—designed to match the RCMS dashboard experience.
              </p>

              <div className="mt-6 grid gap-3 text-sm text-white/85 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
                  Parcel &amp; Khasra search
                </div>
                <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
                  Map-based insights
                </div>
                <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
                  Ownership &amp; land use
                </div>
                <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
                  Reports &amp; exports
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: login card */}
          <div className="flex items-center">
            <div
              className={[
                "w-full transition duration-700 ease-out",
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3",
              ].join(" ")}
            >
              <div className="relative rounded-3xl bg-gradient-to-br from-sky-200/60 via-white/40 to-emerald-200/60 p-[1px] shadow-2xl">
                <div className="relative overflow-hidden rounded-3xl bg-white/95 p-7 backdrop-blur-sm lg:p-10">
                  {/* subtle animated glow */}
                  <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-200/45 blur-3xl animate-pulse" />
                  <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl animate-pulse" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="w-full text-center">
                      <h2 className="text-2xl font-semibold text-slate-900">
                        Sign in
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Use your RUDA RCMS credentials to continue.
                      </p>

                      <div className="mt-4 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Secure access
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>
                  <div className="relative mt-2">
                    <div className="absolute left-3 top-2.5 grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-500">
                      <Mail size={16} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-slate-900 outline-none transition hover:border-slate-300 focus:border-sky-300 focus:ring-4 focus:ring-sky-200/50"
                      placeholder="name@ruda.gov.pk"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative mt-2">
                    <div className="absolute left-3 top-2.5 grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-500">
                      <Lock size={16} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-14 pr-12 text-slate-900 outline-none transition hover:border-slate-300 focus:border-sky-300 focus:ring-4 focus:ring-sky-200/50"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="flex items-center gap-2 text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-green-700 focus:ring-sky-200/60"
                    />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="font-medium text-green-800 hover:text-green-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-green-900 via-green-800 to-emerald-700 py-3 font-semibold text-white shadow-sm transition hover:from-green-800 hover:via-green-700 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-sky-200/60 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                    <span className="absolute -left-20 top-0 h-full w-28 skew-x-[-20deg] bg-white/20 blur-sm animate-pulse" />
                  </span>
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  No registration required. If you don’t have access, contact the
                  system administrator.
                </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
