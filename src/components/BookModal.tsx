import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { Era, Figure } from "../data/schema";
import type { FigureProgress } from "../game/state";
import { Seal } from "./Seal";

const VOLUME_LABELS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

const volumeLabel = (index: number) =>
  VOLUME_LABELS[index] ?? String(index + 1);

type BookModalProps = {
  era: Era;
  figures: Figure[];
  progress: Record<string, FigureProgress>;
  onClose: () => void;
  onOpenFigure: (figureId: string) => void;
  onRestartFigure: (figureId: string) => void;
};

export function BookModal({
  era,
  figures,
  progress,
  onClose,
  onOpenFigure,
  onRestartFigure,
}: BookModalProps) {
  const [opened, setOpened] = useState(false);
  const [selectedId, setSelectedId] = useState(figures[0]?.id ?? "");
  const [dragging, setDragging] = useState(false);
  const [dragAngle, setDragAngle] = useState(0);
  const [turning, setTurning] = useState<{
    direction: "prev" | "next";
    from: number;
    to: number;
  } | null>(null);

  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const tocRef = useRef<HTMLButtonElement>(null);
  const pageContentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number | null>(null);
  const movedRef = useRef(false);
  const closingRef = useRef(false);
  const turnTimersRef = useRef<number[]>([]);
  const onCloseRef = useRef(onClose);
  const requestCloseRef = useRef<() => void>(() => {});

  const selected =
    figures.find((figure) => figure.id === selectedId) ?? figures[0];
  const selectedIndex = figures.findIndex(
    (figure) => figure.id === selected?.id,
  );
  const count = selected ? (progress[selected.id]?.visited.length ?? 0) : 0;
  const percent = selected
    ? Math.round((count / selected.route.length) * 100)
    : 0;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < figures.length - 1;
  const prevFigure = hasPrev ? figures[selectedIndex - 1] : undefined;
  const nextFigure = hasNext ? figures[selectedIndex + 1] : undefined;

  onCloseRef.current = onClose;

  const focusSelected = () => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      document
        .querySelector<HTMLButtonElement>(".book-toc-mobile__item.is-active")
        ?.focus();
    } else {
      tocRef.current?.focus();
    }
  };

  const openBook = () => {
    if (opened) return;
    setOpened(true);
    setDragging(false);
    setDragAngle(0);

    window.setTimeout(focusSelected, 160);
  };

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const delay = opened ? 720 : 180;
    setOpened(false);

    window.setTimeout(() => {
      onCloseRef.current();
      window.setTimeout(() => {
        document.getElementById(`book-${era.id}`)?.focus();
      }, 0);
    }, delay);
  };

  requestCloseRef.current = requestClose;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    openRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestCloseRef.current();
    };

    window.addEventListener("keydown", onKey);
    const turnTimers = turnTimersRef.current;

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      turnTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!opened) return;
    pageContentRef.current?.scrollTo({ top: 0 });
  }, [selectedId, opened]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (opened) return;
    dragStartRef.current = event.clientX;
    movedRef.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || opened || dragStartRef.current === null) return;

    const delta = event.clientX - dragStartRef.current;
    if (Math.abs(delta) > 5) movedRef.current = true;
    setDragAngle(Math.max(-175, Math.min(0, delta * 0.55)));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || dragStartRef.current === null) return;

    const delta = event.clientX - dragStartRef.current;
    const finalAngle = Math.max(-175, Math.min(0, delta * 0.55));
    const shouldOpen = finalAngle <= -50 || !movedRef.current;

    dragStartRef.current = null;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (shouldOpen) {
      openBook();
    } else {
      setDragAngle(0);
    }
  };

  const turnPage = (direction: "prev" | "next") => {
    if (!opened || turning) return;

    const nextIndex =
      direction === "next" ? selectedIndex + 1 : selectedIndex - 1;

    if (nextIndex < 0 || nextIndex >= figures.length) return;

    const nextId = figures[nextIndex].id;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    setTurning({
      direction,
      from: selectedIndex,
      to: nextIndex,
    });

    const changeDelay = reducedMotion
      ? 220
      : direction === "next"
        ? 560
        : 760;
    const endDelay = reducedMotion
      ? 570
      : direction === "next"
        ? 1160
        : 1210;

    const changeTimer = window.setTimeout(() => {
      setSelectedId(nextId);
      if (pageContentRef.current) pageContentRef.current.scrollTop = 0;
    }, changeDelay);

    const endTimer = window.setTimeout(() => {
      setTurning(null);
      focusSelected();
    }, endDelay);

    turnTimersRef.current.push(changeTimer, endTimer);
  };

  const coverStyle = !opened
    ? {
        transform: `rotateY(${dragAngle}deg) translateZ(1px)`,
      }
    : undefined;

  return createPortal(
    <div
      className="book-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${era.name} · 人物卷`}
    >
      <div className="book-modal__backdrop" onClick={requestClose} />

      <button
        ref={closeRef}
        type="button"
        className="book-modal__close"
        onClick={requestClose}
      >
        合上
      </button>

      <div className="book-modal__frame">
        <div
          className={`book-stage ${opened ? "is-open" : ""}`}
          style={
            {
              "--book-accent": era.skin.accent,
              "--book-seal": era.skin.seal,
            } as CSSProperties
          }
        >
          <div
            className="book-page book-page--right"
            aria-hidden={!opened}
          >
            <div
              ref={pageContentRef}
              className={`book-page__content ${
                figures.length > 1 ? "has-pager" : ""
              }`}
            >
              <div
                className="book-toc-mobile"
                role="group"
                aria-label="人物目录"
              >
                {figures.map((figure) => (
                  <button
                    key={figure.id}
                    type="button"
                    aria-pressed={figure.id === selected?.id}
                    className={`book-toc-mobile__item ${
                      figure.id === selected?.id ? "is-active" : ""
                    }`}
                    onClick={() => setSelectedId(figure.id)}
                  >
                    {figure.name}
                  </button>
                ))}
              </div>

              {selected && (
                <div className="book-detail">
                  <header className="book-detail__head">
                    <div className="book-detail__title-row">
                      <div>
                        <p className="meta">
                          {era.name} · 卷{volumeLabel(selectedIndex)}
                        </p>
                        <h2>{selected.name}</h2>
                        <p className="book-detail__years">
                          {selected.birth}—{selected.death} ·{" "}
                          {selected.courtesy}
                        </p>
                      </div>
                      <Seal
                        text={selected.seal}
                        className="h-9 w-9 shrink-0 text-[11px]"
                      />
                    </div>
                  </header>

                  <p className="book-detail__summary">{selected.summary}</p>

                  <ol className="book-detail__acts">
                    {selected.acts.map((act) => (
                      <li key={act.id}>
                        <span className="book-detail__act-index">{act.id}</span>
                        <div>
                          <strong>{act.title}</strong>
                          <em>{act.line}</em>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="book-detail__progress">
                    <div className="book-detail__bar">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <p>
                      已读 {count} / {selected.route.length} 站
                    </p>
                  </div>

                  <div className="book-detail__actions">
                    <button
                      type="button"
                      className="btn-ink"
                      onClick={() => onOpenFigure(selected.id)}
                    >
                      {count > 0 ? "继续重走" : "开始重走"}
                    </button>
                    {count > 0 && (
                      <button
                        type="button"
                        className="book-chapter__reset"
                        onClick={() => onRestartFigure(selected.id)}
                      >
                        从头再走
                      </button>
                    )}
                    <Link
                      to={`/circle/${selected.id}`}
                      className="book-detail__circle-link"
                      title="同代人物星图"
                    >
                      朋友圈 →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {figures.length > 1 && (
              <div className="book-pager">
                <button
                  type="button"
                  className="book-pager__button"
                  onClick={() => turnPage("prev")}
                  disabled={turning !== null || !hasPrev}
                  aria-label={
                    prevFigure ? `上一卷：${prevFigure.name}` : "已是第一卷"
                  }
                >
                  ← 上一卷
                </button>
                <span className="book-pager__count">
                  {`卷${volumeLabel(selectedIndex)} · 共${volumeLabel(
                    figures.length - 1,
                  )}卷`}
                </span>
                <button
                  type="button"
                  className="book-pager__button"
                  onClick={() => turnPage("next")}
                  disabled={turning !== null || !hasNext}
                  aria-label={
                    nextFigure ? `下一卷：${nextFigure.name}` : "已是最后一卷"
                  }
                >
                  下一卷 →
                </button>
              </div>
            )}
          </div>

          {turning && (
            <div
              className={`book-turn book-turn--${turning.direction}`}
              aria-hidden="true"
            >
              <div className="book-turn__face">
                <span className="book-turn__name">
                  {figures[turning.from]?.name}
                </span>
                <span className="book-turn__folio">
                  {`卷${volumeLabel(turning.from)}`}
                </span>
              </div>
              <div className="book-turn__face book-turn__face--back">
                <span className="book-turn__name">
                  {figures[turning.to]?.name}
                </span>
                <span className="book-turn__folio">
                  {`卷${volumeLabel(turning.to)}`}
                </span>
              </div>
            </div>
          )}

          <div
            className={`book-cover ${dragging ? "is-dragging" : ""}`}
            style={coverStyle}
            aria-hidden={!opened}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className="book-cover__face book-cover__face--front"
              aria-hidden="true"
            >
              <div className="book-cover__frame">
                <span className="book-cover__brand">霞客行</span>
                <span className="book-cover__title">{era.name}</span>
                <span className="book-cover__subtitle">人物卷</span>
                <span className="book-cover__seal">
                  {era.name.slice(0, 1)}
                </span>
                <span className="book-cover__years">
                  {era.start}—{era.end}
                </span>
              </div>
            </div>

            <div className="book-cover__face book-cover__face--back">
              <div className="book-toc">
                <header>
                  <p className="meta">
                    {era.name} · {era.start}—{era.end}
                  </p>
                  <h3>目录</h3>
                  <p className="book-toc__sub">共 {figures.length} 卷</p>
                </header>

                <ul>
                  {figures.map((figure, index) => {
                    const visited =
                      progress[figure.id]?.visited.length ?? 0;
                    const active = figure.id === selected?.id;

                    return (
                      <li key={figure.id}>
                        <button
                          ref={active ? tocRef : undefined}
                          type="button"
                          aria-pressed={active}
                          className={`book-toc__item ${
                            active ? "is-active" : ""
                          }`}
                          onClick={() => setSelectedId(figure.id)}
                        >
                          <span className="book-toc__index">
                            卷{volumeLabel(index)}
                          </span>
                          <span className="book-toc__name">
                            {figure.name}
                          </span>
                          <span className="book-toc__meta">
                            {figure.birth}—{figure.death}
                          </span>
                          <span className="book-toc__count">
                            {visited}/{figure.route.length}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <p className="book-toc__hint">点目录，切换人物</p>

                <span className="book-cover__inside-seal" aria-hidden="true">
                  {era.name.slice(0, 1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!opened && (
          <div className="book-modal__open-wrap">
            <button
              ref={openRef}
              type="button"
              className="book-modal__open"
              onClick={openBook}
            >
              <span className="book-modal__arrow" aria-hidden="true">
                ←
              </span>
              翻开
            </button>
            <p className="book-modal__hint">
              点击按钮，或按住封面向左拖
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
