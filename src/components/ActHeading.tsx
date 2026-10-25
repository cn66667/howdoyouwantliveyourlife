import type { Act } from "../data/schema";

const numerals = ["一", "二", "三", "四"] as const;

export function ActHeading({ act }: { act: Act }) {
  return (
    <header className="flex items-end gap-4 pb-1 pt-6">
      <span className="font-kai text-5xl leading-none text-ink/15">
        {numerals[act.id - 1]}
      </span>
      <div className="pb-1">
        <p className="meta">第{numerals[act.id - 1]}幕</p>
        <h2 className="mt-1 font-kai text-2xl tracking-[0.16em] text-ink">
          {act.title}
        </h2>
        <p className="mt-1 text-xs tracking-wider text-ink-faint">{act.line}</p>
      </div>
      <div className="ink-rule mb-3 flex-1" />
    </header>
  );
}
