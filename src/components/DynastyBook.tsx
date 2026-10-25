import type { CSSProperties } from "react";
import type { Era } from "../data/schema";

type DynastyBookProps = {
  era: Era;
  count: number;
  onOpen: () => void;
};

export function DynastyBook({ era, count, onOpen }: DynastyBookProps) {
  return (
    <button
      id={`book-${era.id}`}
      type="button"
      onClick={onOpen}
      className="shelf-book"
      style={{ "--book-accent": era.skin.accent } as CSSProperties}
      aria-label={`翻开${
        era.name === "民国" ? "民国" : `${era.name}朝`
      }人物卷，共 ${count} 卷`}
    >
      <span className="shelf-book__brand">霞客行</span>
      <span className="shelf-book__title">{era.name}</span>
      <span className="shelf-book__meta">{count} 卷</span>
      <span className="shelf-book__seal" aria-hidden="true">
        {era.name.slice(0, 1)}
      </span>
    </button>
  );
}
