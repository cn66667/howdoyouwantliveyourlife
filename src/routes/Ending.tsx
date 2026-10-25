import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NotFound } from "../components/NotFound";
import { Seal } from "../components/Seal";
import { getEra, resolveRoute } from "../data/eras";
import { getFigure } from "../data/figures";
import { useJourney } from "../game/state";

export default function Ending() {
  const { figureId } = useParams();
  const figure = getFigure(figureId);
  const navigate = useNavigate();
  const progress = useJourney((state) =>
    figure ? state.progress[figure.id] : undefined,
  );
  const visited = progress?.visited ?? [];
  const choices = progress?.choices ?? {};
  const start = useJourney((state) => state.start);
  const reset = useJourney((state) => state.reset);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!figure) return <NotFound />;

  const era = getEra(figure.eraId);
  const events = resolveRoute(figure);
  const visitedCount = events.filter((event) =>
    visited.includes(event.id),
  ).length;
  const answered = events.filter(
    (event) => choices[event.id] !== undefined,
  ).length;
  const withChoice = events.filter((event) => event.choice);

  const restart = () => {
    reset(figure.id);
    start(figure.id);
    navigate(`/play/${figure.id}`);
  };

  const returnToShelf = () => {
    if (returning) return;
    setReturning(true);
    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      document.body.style.overflow = "";
      navigate("/");
    }, 1600);
  };

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-16">
      <p className="meta text-center">卷终</p>
      <h1 className="mt-4 text-center font-kai text-4xl tracking-[0.18em] text-ink sm:text-5xl">
        {figure.name}
      </h1>
      <p className="mt-3 text-center text-sm tracking-[0.2em] text-ink-faint">
        一生行迹 · {figure.birth}—{figure.death} · {figure.courtesy}
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "行经", value: `${visitedCount} 站` },
          { label: "抉择", value: `${answered} 处` },
          {
            label: "起于",
            value: `${events[0]?.year ?? ""} 年`,
          },
          {
            label: "止于",
            value: `${events[events.length - 1]?.year ?? ""} 年`,
          },
        ].map((stat) => (
          <div key={stat.label} className="paper-card px-4 py-4 text-center">
            <p className="meta">{stat.label}</p>
            <p className="mt-2 font-kai text-xl tabular-nums text-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="paper-card mt-8 p-7 sm:p-10">
        <div className="flex items-start gap-5">
          <Seal text={figure.seal} className="h-12 w-12 shrink-0 text-sm" />
          <p className="font-kai text-[16px] leading-9 text-ink-soft sm:text-[17px]">
            {figure.epilogue}
          </p>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline gap-4">
          <h2 className="font-kai text-xl tracking-[0.14em]">你的抉择</h2>
          <div className="ink-rule flex-1" />
          <span className="meta tabular-nums">
            {answered} / {withChoice.length}
          </span>
        </div>

        <ul className="mt-4">
          {withChoice.map((event) => {
            const chosen = choices[event.id];
            const option =
              chosen !== undefined ? event.choice?.options[chosen] : undefined;

            return (
              <li
                key={event.id}
                className="border-t border-ink/10 py-5 first:border-t-0"
              >
                <p className="text-xs tracking-wider text-ink-faint">
                  {event.year} · {event.age} 岁 · {event.place.ancient}
                </p>
                <p className="mt-1.5 font-kai text-base text-cinnabar-deep">
                  {event.choice?.prompt}
                </p>
                <p className="mt-1.5 text-sm text-ink">
                  {option ? option.text : "未择"}
                </p>
                {option && (
                  <p className="mt-1 text-[13px] leading-7 text-ink-faint">
                    {option.echo}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12 border-t border-ink/10 pt-6 text-xs leading-6 text-ink-faint">
        <p>文献依据：{figure.sources.join("；")}。</p>
        <p className="mt-1">
          本卷为可交互的历史叙事，人物生平依据常见记载编写；抉择不改变史实。
        </p>
      </section>

      <p className="mt-10 text-center">
        <Link
          to={`/circle/${figure.id}`}
          className="font-kai text-sm tracking-[0.14em] text-ink-faint underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink"
        >
          同代人物 · 朋友圈 →
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={returnToShelf}
          disabled={returning}
          className="btn-ink"
        >
          放回书架
        </button>
        <button type="button" onClick={restart} className="btn-ghost">
          再走一遍
        </button>
        <button
          type="button"
          disabled
          title="M4 开放"
          className="cursor-not-allowed border border-ink/15 px-4 py-1.5 font-kai text-sm tracking-[0.14em] text-ink/30"
        >
          生成分享卡
        </button>
      </div>

      {returning &&
        era &&
        createPortal(
          <div className="return-overlay" role="status" aria-live="polite">
            <div
              className="return-stage"
              style={
                {
                  "--book-accent": era.skin.accent,
                  "--book-seal": era.skin.seal,
                } as CSSProperties
              }
            >
              <div className="return-book" aria-hidden="true">
                <span className="return-book__brand">霞客行</span>
                <span className="return-book__title">{era.name}</span>
                <span className="return-book__seal">
                  {era.name.slice(0, 1)}
                </span>
              </div>
              <div className="return-shelf" aria-hidden="true" />
            </div>
            <p className="return-label">正在放回书架…</p>
          </div>,
          document.body,
        )}
    </main>
  );
}
