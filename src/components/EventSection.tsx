import { motion } from "framer-motion";
import type { ResolvedEvent } from "../data/eras";
import { QuoteBlock } from "./QuoteBlock";
import { Seal } from "./Seal";

type EventSectionProps = {
  event: ResolvedEvent;
  chosen: number | undefined;
  nextId: string | undefined;
  onChoose: (option: number) => void;
};

export function EventSection({
  event,
  chosen,
  nextId,
  onChoose,
}: EventSectionProps) {
  const goNext = () => {
    if (!nextId) return;
    document
      .getElementById(nextId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showNext = nextId && (!event.choice || chosen !== undefined);

  return (
    <motion.article
      id={event.id}
      initial={{ y: 18 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="paper-card scroll-mt-28 p-6 sm:p-9"
    >
      <header>
        <div className="flex items-baseline gap-3">
          <span className="font-kai text-3xl leading-none tracking-wide text-ink">
            {event.year}
          </span>
          <span className="meta">公元</span>
          <span className="font-kai text-lg text-cinnabar">{event.age} 岁</span>
        </div>
        <h2 className="mt-4 font-kai text-2xl tracking-[0.08em] text-ink sm:text-[28px]">
          {event.title}
        </h2>
        <p className="mt-1.5 text-sm tracking-wide text-ink-faint">
          {event.place.ancient}
          <span className="mx-2 text-ink/20">·</span>
          今{event.place.modern}
        </p>
      </header>

      {event.quote && <QuoteBlock quote={event.quote} />}

      <p className="mt-6 font-serif text-[15px] leading-8 text-ink-soft [text-indent:2em] sm:text-base sm:leading-9">
        {event.narrative}
      </p>

      {event.choice && (
        <div className="mt-6 border border-cinnabar/25 bg-cinnabar/[0.035] p-4 sm:p-5">
          <p className="font-kai text-base tracking-wide text-cinnabar-deep">
            {event.choice.prompt}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {event.choice.options.map((option, index) => {
              const selected = chosen === index;
              const locked = chosen !== undefined;
              return (
                <button
                  key={option.text}
                  type="button"
                  disabled={locked}
                  onClick={() => onChoose(index)}
                  className={[
                    "border px-4 py-2 font-kai text-sm tracking-wide transition-colors",
                    selected
                      ? "border-cinnabar bg-cinnabar text-[#f7ecda]"
                      : "border-ink/25 text-ink-soft",
                    locked && !selected
                      ? "cursor-not-allowed opacity-40"
                      : "hover:border-cinnabar/60 hover:text-cinnabar-deep",
                  ].join(" ")}
                >
                  {option.text}
                </button>
              );
            })}
          </div>
          {chosen !== undefined && (
            <div className="mt-4 flex items-start gap-3">
              <Seal text="择" className="mt-1 h-6 w-6 text-[10px]" />
              <p className="font-kai text-[15px] leading-7 text-ink-soft">
                {event.choice.options[chosen]?.echo}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-ink/10 pt-4">
        <p className="text-xs leading-6 text-ink-faint">
          出处：{event.refs.join("；")}
        </p>
        {showNext && (
          <button type="button" onClick={goNext} className="btn-ghost">
            继续向前
            <span aria-hidden="true">↓</span>
          </button>
        )}
      </div>
    </motion.article>
  );
}
