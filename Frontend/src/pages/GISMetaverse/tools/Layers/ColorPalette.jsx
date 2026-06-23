const COLORS = [
  "#6bb7e8",
  "#f8d56b",
  "#6bd69a",
  "#f59e72",
  "#b99cf3",
  "#78d6d0",
];

export default function ColorPalette({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className="h-5 w-5 rounded-sm border"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}