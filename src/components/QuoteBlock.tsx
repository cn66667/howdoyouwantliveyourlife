import type { Quote } from "../data/schema";

export function QuoteBlock({ quote }: { quote: Quote }) {
  const pending = quote.status === "pending";

  return (
    <figure className="relative mt-6 border-l-2 border-cinnabar/70 bg-[#f3ead6]/60 py-4 pl-5 pr-4">
      <blockquote className="font-kai text-[17px] leading-8 tracking-wide text-ink sm:text-lg">
        {quote.text}
      </blockquote>
      <figcaption className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
        <span>——《{quote.work}》</span>
        {pending && (
          <span className="border border-cinnabar/30 px-1.5 py-0.5 text-[10px] tracking-wider text-cinnabar-deep">
            原文待校
          </span>
        )}
      </figcaption>
    </figure>
  );
}
