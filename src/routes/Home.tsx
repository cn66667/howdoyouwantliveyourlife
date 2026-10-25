import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookModal } from "../components/BookModal";
import { DynastyBook } from "../components/DynastyBook";
import { Seal } from "../components/Seal";
import { eras } from "../data/eras";
import { figures } from "../data/figures";
import { useJourney } from "../game/state";

export default function Home() {
  const navigate = useNavigate();
  const progress = useJourney((state) => state.progress);
  const start = useJourney((state) => state.start);
  const reset = useJourney((state) => state.reset);
  const [openEraId, setOpenEraId] = useState<string | null>(null);

  const shelves = useMemo(
    () =>
      eras
        .map((era) => ({
          era,
          figures: figures.filter((figure) => figure.eraId === era.id),
        }))
        .filter((shelf) => shelf.figures.length > 0)
        .sort((a, b) => a.era.start - b.era.start),
    [],
  );

  const openShelf = shelves.find((shelf) => shelf.era.id === openEraId);

  const openFigure = (figureId: string) => {
    start(figureId);
    navigate(`/play/${figureId}`);
  };

  const restartFigure = (figureId: string) => {
    reset(figureId);
    start(figureId);
    navigate(`/play/${figureId}`);
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-8 sm:pt-12">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <Seal text="霞客" className="h-10 w-10 text-[13px]" />
            <span className="meta">霞客行</span>
          </div>
          <p className="vtext hidden font-kai text-sm text-ink-faint md:block">
            路是人走出来的
          </p>
        </div>

        <section className="mt-14 max-w-2xl sm:mt-20">
          <p className="meta">历史人物 · 一生行迹</p>
          <h1 className="mt-5 font-kai text-6xl tracking-[0.14em] text-ink sm:text-7xl">
            霞客行
          </h1>
          <p className="mt-4 font-serif text-lg tracking-wide text-ink-soft">
            重走一个人的一生
          </p>

          <div className="ink-rule mt-8 max-w-sm" />

          <p className="mt-8 font-serif text-[15px] leading-8 text-ink-soft sm:text-base sm:leading-9">
            书架上一个朝代一卷书。翻开一本书，选择一个人物，沿他的年龄与足迹走完这一生。
          </p>
        </section>

        <section className="mt-12">
          <div className="flex items-baseline gap-4">
            <p className="meta">书架</p>
            <div className="ink-rule flex-1" />
            <span className="meta">
              {shelves.length} 个朝代 · {figures.length} 卷
            </span>
          </div>

          <div className="shelf mt-8">
            <div className="shelf__row">
              <span className="shelf__bookend" aria-hidden="true" />
              {shelves.map((shelf) => (
                <DynastyBook
                  key={shelf.era.id}
                  era={shelf.era}
                  count={shelf.figures.length}
                  onOpen={() => setOpenEraId(shelf.era.id)}
                />
              ))}
              <span className="shelf__bookend" aria-hidden="true" />
            </div>
            <div className="shelf__plank" aria-hidden="true" />
          </div>

          <p className="mt-4 text-center text-xs tracking-wider text-ink-faint">
            点一本书，翻开一个朝代。更多朝代整理中。
          </p>
        </section>

        <footer className="mt-16 border-t border-ink/10 pt-6 text-xs leading-6 text-ink-faint">
          <p>
            年龄按周岁计。引文标注「原文待校」者，尚未与原文逐字核对。
          </p>
          {figures.map((figure) => (
            <p key={figure.id} className="mt-1">
              {figure.name}：{figure.sources.join("；")}。
            </p>
          ))}
          <p className="mt-1">
            地图底图为天地图地形，历史地名为示意位置，不表示历史疆域。
          </p>
        </footer>
      </div>

      {openShelf && (
        <BookModal
          era={openShelf.era}
          figures={openShelf.figures}
          progress={progress}
          onClose={() => setOpenEraId(null)}
          onOpenFigure={openFigure}
          onRestartFigure={restartFigure}
        />
      )}
    </main>
  );
}
