"use client";

/** Category filter. Square-cornered chips with a hairline border; the active one is filled ink. */
export function FilterChips({
  categories,
  value,
  onChange,
  label,
}: {
  categories: string[];
  value: string | null;
  onChange: (category: string | null) => void;
  label: string;
}) {
  if (categories.length < 2) return null;
  const chip = (active: boolean) =>
    `h-9 border px-3.5 text-[0.75rem] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ${
      active ? "border-ink bg-ink text-paper" : "border-hairline bg-transparent text-ink hover:border-ink"
    }`;
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2 py-6">
      <button type="button" className={chip(value === null)} aria-pressed={value === null} onClick={() => onChange(null)}>
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={chip(value === category)}
          aria-pressed={value === category}
          onClick={() => onChange(value === category ? null : category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
