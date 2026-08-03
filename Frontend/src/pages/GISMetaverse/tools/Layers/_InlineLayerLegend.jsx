/**
 * _InlineLayerLegend.jsx
 *
 * Renders a compact, inline legend beneath a layer's opacity slider.
 * Supports polygon, line, dashed-line, point, and custom symbol types.
 *
 * Props:
 *   items     – Array of legend item objects (see _legendUtils.js)
 *   opacity   – Current layer opacity 0-100 (applied to symbols, not labels)
 *   className – Optional extra class on the container
 *   emptyMessage – Optional text shown when items is empty
 */
export default function InlineLayerLegend({
  items = [],
  opacity = 100,
  className = "",
  emptyMessage = "",
}) {
  if (!items || items.length === 0) {
    if (emptyMessage) {
      return (
        <p className={`mt-2 pl-8 text-[10px] text-white/45 ${className}`}>
          {emptyMessage}
        </p>
      );
    }
    return null;
  }

  const symbolOpacity = Math.max(0, Math.min(100, opacity)) / 100;

  return (
    <div className={`mt-2 space-y-1.5 pl-8 pr-2 ${className}`}>
      {items.map((item) => (
        <div key={item.id || item.label} className="flex items-center gap-2.5">
          <LegendSymbol item={item} opacity={symbolOpacity} />
          <span
            className="min-w-0 flex-1 text-[10px] font-medium leading-tight text-white/75"
            style={{ wordBreak: "break-word" }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LegendSymbol({ item, opacity }) {
  if (item.renderSymbol) {
    return (
      <span className="shrink-0" style={{ opacity }}>
        {item.renderSymbol(item)}
      </span>
    );
  }

  const type = item.type || "polygon";

  if (type === "polygon") {
    return (
      <span
        className="h-3 w-5 shrink-0 rounded-[2px] border"
        style={{
          backgroundColor: item.fillColor || item.color,
          borderColor: item.borderColor || item.color,
          opacity,
        }}
      />
    );
  }

  if (type === "line") {
    return (
      <span className="flex h-3 w-5 shrink-0 items-center" style={{ opacity }}>
        <span
          className="block w-full rounded-full"
          style={{
            height: `${item.width || 2}px`,
            backgroundColor: item.color,
          }}
        />
      </span>
    );
  }

  if (type === "dashed-line") {
    return (
      <span className="flex h-3 w-5 shrink-0 items-center" style={{ opacity }}>
        <span
          className="block w-full"
          style={{
            height: `${item.width || 2}px`,
            background: `repeating-linear-gradient(to right, ${item.color} 0, ${item.color} 5px, transparent 5px, transparent 9px)`,
            borderRadius: "2px",
          }}
        />
      </span>
    );
  }

  if (type === "point") {
    return (
      <span
        className="flex h-3 w-5 shrink-0 items-center justify-center"
        style={{ opacity }}
      >
        <span
          className="rounded-full border"
          style={{
            width: `${(item.radius || 5) * 2}px`,
            height: `${(item.radius || 5) * 2}px`,
            backgroundColor: item.color,
            borderColor: item.borderColor || "#ffffff",
            borderWidth: "1px",
            maxWidth: "12px",
            maxHeight: "12px",
          }}
        />
      </span>
    );
  }

  if (type === "square") {
    return (
      <span
        className="h-3 w-3 shrink-0"
        style={{
          backgroundColor: item.color,
          opacity,
        }}
      />
    );
  }

  // Fallback: polygon
  return (
    <span
      className="h-3 w-5 shrink-0 rounded-[2px] border"
      style={{
        backgroundColor: item.fillColor || item.color,
        borderColor: item.borderColor || item.color,
        opacity,
      }}
    />
  );
}
