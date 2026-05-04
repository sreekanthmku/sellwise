export function TabButton({ active, onClick, icon: Icon, label, count, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      aria-pressed={active}
      className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[12px] px-2.5 py-2.5 text-[13px] font-semibold transition-colors ${
        active
          ? "bg-[color:var(--blue-600)] text-white"
          : "border border-[#e4e4e4] bg-white text-[color:var(--blue-600)]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      <span className="min-w-0 truncate">{label}</span>
      <span
        className={`flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
          active ? "bg-[color:var(--suzuki-blue)] text-white" : "bg-[color:var(--blue-300)] text-[color:var(--blue-600)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
