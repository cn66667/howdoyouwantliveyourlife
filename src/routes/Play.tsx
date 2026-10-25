import { Fragment, Suspense, lazy, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ActHeading } from "../components/ActHeading";
import { EventSection } from "../components/EventSection";
import { MapChrome } from "../components/MapChrome";
import { NotFound } from "../components/NotFound";
import { Seal } from "../components/Seal";
import { getAdminPlaces, resolveRoute } from "../data/eras";
import { getFigure } from "../data/figures";
import { useMapPrefs } from "../game/mapPrefs";
import { useJourney } from "../game/state";
import { hasTiandituKey } from "../lib/mapStyle";

const InkMap = lazy(() =>
  import("../components/InkMap").then((module) => ({
    default: module.InkMap,
  })),
);

export default function Play() {
  const { figureId } = useParams();
  const figure = getFigure(figureId);
  const progress = useJourney((state) =>
    figure ? state.progress[figure.id] : undefined,
  );
  const visited = progress?.visited ?? [];
  const choices = progress?.choices ?? {};
  const start = useJourney((state) => state.start);
  const markVisited = useJourney((state) => state.markVisited);
  const choose = useJourney((state) => state.choose);
  const basemap = useMapPrefs((state) => state.basemap);
  const showProvinces = useMapPrefs((state) => state.showProvinces);
  const toggleBasemap = useMapPrefs((state) => state.toggleBasemap);
  const toggleProvinces = useMapPrefs((state) => state.toggleProvinces);

  const events = useMemo(
    () => (figure ? resolveRoute(figure) : []),
    [figure],
  );

  const adminPlaces = useMemo(
    () => (figure ? getAdminPlaces(figure.eraId) : []),
    [figure],
  );

  useEffect(() => {
    if (figure) {
      start(figure.id);
    }
  }, [figure, start]);

  useEffect(() => {
    if (events.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const cutoff = window.innerHeight * 0.3;
      const seen = events
        .filter((event) => {
          const node = document.getElementById(event.id);
          return node ? node.getBoundingClientRect().top < cutoff : false;
        })
        .map((event) => event.id);
      if (seen.length > 0) markVisited(seen);
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [events, markVisited]);

  if (!figure) return <NotFound />;

  const visitedIds = new Set(visited);
  const visitedCount = events.filter((event) => visitedIds.has(event.id)).length;
  const percent = Math.round((visitedCount / events.length) * 100);
  const reachedIndex = events.reduce(
    (max, event, index) => (visitedIds.has(event.id) ? index : max),
    -1,
  );

  const scrollToEvent = (eventId: string) => {
    document
      .getElementById(eventId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Seal text={figure.seal} className="h-8 w-8 text-[11px]" />
            <span className="font-kai text-base tracking-[0.16em]">
              霞客行
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="meta hidden tabular-nums sm:inline">
              {visitedCount} / {events.length} 站
            </span>
            <div
              className="h-1 w-20 overflow-hidden rounded-full bg-ink/10 sm:w-28"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={events.length}
              aria-valuenow={visitedCount}
              aria-label="行程进度"
            >
              <div
                className="h-full bg-cinnabar transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <Link to={`/play/${figure.id}/end`} className="btn-ghost">
              合上
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-6 lg:grid lg:grid-cols-[45%_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="lg:sticky lg:top-20">
          <div className="paper-card relative h-[38vh] overflow-hidden lg:h-[calc(100vh-6rem)]">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-[#f0e7d5] font-kai text-sm tracking-[0.2em] text-ink-faint">
                  舆图载入中…
                </div>
              }
            >
              <div className="absolute inset-0">
                <InkMap
                  events={events}
                  adminPlaces={adminPlaces}
                  basemap={basemap}
                  showProvinces={showProvinces}
                  visited={visited}
                  reachedIndex={reachedIndex}
                  onSelect={scrollToEvent}
                />
              </div>
            </Suspense>
            <div className="ink-map-vignette pointer-events-none absolute inset-0 z-[1]" />
            <MapChrome
              eraName={figure.dynasty}
              basemap={basemap}
              showProvinces={showProvinces}
              hasKey={hasTiandituKey}
              onToggleBasemap={toggleBasemap}
              onToggleProvinces={toggleProvinces}
            />
          </div>
        </div>

        <div>
          {events.map((event, index) => {
            const act = figure.acts.find((item) => item.id === event.act);
            const isActStart =
              index === 0 || events[index - 1].act !== event.act;

            return (
              <Fragment key={event.id}>
                {isActStart && act && <ActHeading act={act} />}
                <EventSection
                  event={event}
                  chosen={choices[event.id]}
                  nextId={events[index + 1]?.id}
                  onChoose={(option) => choose(event.id, option)}
                />
              </Fragment>
            );
          })}

          <div className="mt-14 text-center">
            <Link to={`/play/${figure.id}/end`} className="btn-ink">
              合上此卷 · 看这一生
            </Link>
            <p className="mt-3 text-xs tracking-wider text-ink-faint">
              已读 {visitedCount} / {events.length} 站
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
