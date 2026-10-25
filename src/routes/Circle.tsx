import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NotFound } from "../components/NotFound";
import { Seal } from "../components/Seal";
import {
  CIRCLE_TONE_META,
  CIRCLE_TONE_ORDER,
  getCircle,
} from "../data/circles";
import { getEra } from "../data/eras";
import { getFigure } from "../data/figures";
import { useJourney } from "../game/state";

type Placement = "right" | "left" | "below" | "above";

const DEPTH_RADII: Record<1 | 2 | 3, number> = {
  1: 22,
  2: 28,
  3: 34,
};

const DEPTH_RINGS = [12, 22, 28, 34];

function hashUnit(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

const DUST = Array.from({ length: 38 }, (_, index) => {
  const angle = ((index * 137.508) % 360) * (Math.PI / 180);
  const radius = 5 + ((index * 29) % 45);

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
    r: index % 6 === 0 ? 0.34 : 0.16,
    opacity: 0.14 + ((index * 7) % 42) / 100,
  };
});

export default function Circle() {
  const { figureId } = useParams();
  const figure = getFigure(figureId);
  const navigate = useNavigate();
  const progress = useJourney((state) =>
    figure ? state.progress[figure.id] : undefined,
  );
  const start = useJourney((state) => state.start);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!figure) return <NotFound />;

  const era = getEra(figure.eraId);
  const circle = getCircle(figure.id);

  if (!era || !circle) return <NotFound />;

  const segment = 360 / circle.nodes.length;
  const nodes = circle.nodes.map((node, index) => {
    const baseAngle = -90 + segment * index;
    const angleJitter =
      (hashUnit(`${figure.id}:${node.id}:angle`) - 0.5) * segment * 0.55;
    const radiusJitter =
      (hashUnit(`${figure.id}:${node.id}:radius`) - 0.5) * 3.2;
    const angle = (baseAngle + angleJitter) * (Math.PI / 180);
    const radius = DEPTH_RADII[node.depth] + radiusJitter;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    const dx = x - 50;
    const dy = y - 50;
    const placement: Placement =
      Math.abs(dx) > 12
        ? dx > 0
          ? "right"
          : "left"
        : node.depth === 1
          ? dy < 0
            ? "above"
            : "below"
          : dy < 0
            ? "below"
            : "above";

    return {
      ...node,
      x,
      y,
      placement,
      color: CIRCLE_TONE_META[node.tone].color,
    };
  });

  const coreLabelIds = new Set<string>();

  for (const node of nodes) {
    if (node.depth !== 1 || coreLabelIds.size >= 3) continue;

    const angle = Math.atan2(node.y - 50, node.x - 50);
    const tooClose = [...coreLabelIds].some((id) => {
      const other = nodes.find((item) => item.id === id);
      if (!other) return false;

      const otherAngle = Math.atan2(other.y - 50, other.x - 50);
      let diff = Math.abs(angle - otherAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;

      return diff < (Math.PI * 55) / 180;
    });

    if (!tooClose) coreLabelIds.add(node.id);
  }

  const selected = nodes.find((node) => node.id === selectedId);
  const visited = progress?.visited.length ?? 0;
  const presentTones = CIRCLE_TONE_ORDER.filter((tone) =>
    circle.nodes.some((node) => node.tone === tone),
  );

  const goPlay = () => {
    start(figure.id);
    navigate(`/play/${figure.id}`);
  };

  return (
    <main className="circle-page">
      <div className="circle-page__inner">
        <header className="circle-header">
          <Link to="/" className="circle-back">
            ← 回书架
          </Link>
          <div className="circle-header__meta">
            <span className="meta">
              {era.name} · {figure.birth}—{figure.death}
            </span>
            <Seal
              text={figure.seal}
              className="h-8 w-8 shrink-0 text-[11px]"
            />
          </div>
        </header>

        <section className="circle-intro">
          <p className="meta">{figure.name} · 同代人物</p>
          <h1>朋友圈</h1>
          <p className="circle-intro__sub">与同时代人的交往 · 星图</p>
          <p className="circle-intro__summary">{circle.summary}</p>
        </section>

        <div className="circle-layout">
          <section
            className="star-chart"
            role="group"
            aria-label={`${figure.name}的人物星图`}
          >
            <div className="star-chart__head">
              <span>同代星图</span>
              <span>{circle.nodes.length} 人</span>
            </div>

            <div className="star-chart__sky">
              <svg
                className="star-chart__svg"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                {DEPTH_RINGS.map((radius) => (
                  <circle
                    key={radius}
                    className={`star-ring ${
                      radius < 34 ? "star-ring--depth" : ""
                    }`}
                    cx="50"
                    cy="50"
                    r={radius}
                  />
                ))}
                {DUST.map((star, index) => (
                  <circle
                    key={index}
                    className="star-dust"
                    cx={star.x}
                    cy={star.y}
                    r={star.r}
                    opacity={star.opacity}
                  />
                ))}
                {nodes.map((node) => (
                  <line
                    key={node.id}
                    className={`star-spoke ${
                      selectedId
                        ? selectedId === node.id
                          ? "is-active"
                          : "is-muted"
                        : ""
                    }`}
                    x1="50"
                    y1="50"
                    x2={node.x}
                    y2={node.y}
                    stroke={node.color}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>

              {nodes.map((node) => {
                const active = node.id === selectedId;

                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`star-node ${
                      node.depth === 1 ? "is-core" : ""
                    } ${active ? "is-active" : ""}`}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                    }}
                    aria-pressed={active}
                    aria-label={`${node.name}，${node.relation}`}
                    onClick={() => setSelectedId(active ? null : node.id)}
                  >
                    <span
                      className="star-node__dot"
                      style={{
                        backgroundColor: node.color,
                        color: node.color,
                      }}
                    />
                    <span
                      className={`star-node__label star-node__label--${node.placement} ${
                        coreLabelIds.has(node.id) ? "" : "is-quiet"
                      }`}
                    >
                      <span className="star-node__name">{node.name}</span>
                      <span
                        className="star-node__relation"
                        style={{ color: node.color }}
                      >
                        {node.relation}
                      </span>
                    </span>
                  </button>
                );
              })}

              <div className="star-center" aria-hidden="true">
                <span className="star-center__halo" />
                <Seal text={figure.seal} className="star-center__seal" />
                <span className="star-center__name">{figure.name}</span>
                <span className="star-center__meta">中心人物</span>
              </div>
            </div>

            <div className="star-chart__foot">
              <span>点星看交往</span>
              <span>线越短，关系越深</span>
            </div>
          </section>

          <aside className="circle-aside">
            <div className="circle-aside__head">
              <p className="meta">交往录</p>
              <span>
                {selected ? "一人" : `${circle.nodes.length} 人`}
              </span>
            </div>

            <div className="circle-aside__body" aria-live="polite">
              {selected ? (
                <>
                  <p className="circle-aside__tag">
                    <i
                      style={{ backgroundColor: selected.color }}
                      aria-hidden="true"
                    />
                    {selected.tone} · {selected.relation}
                  </p>
                  <h2>{selected.name}</h2>
                  <p className="circle-aside__years">
                    {selected.years} · {selected.role}
                  </p>
                  <p className="circle-aside__note">{selected.note}</p>
                  <button
                    type="button"
                    className="circle-aside__back"
                    onClick={() => setSelectedId(null)}
                  >
                    ← 看全部
                  </button>
                </>
              ) : (
                <>
                  <p className="circle-aside__intro">
                    以{figure.name}为心，{circle.nodes.length}
                    位同代人物环绕。点选星点，或从名录进入；桌面悬停可先看姓名。
                  </p>
                  <ul className="circle-list">
                    {nodes.map((node) => (
                      <li key={node.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(node.id)}
                        >
                          <span
                            className="circle-list__dot"
                            style={{ backgroundColor: node.color }}
                            aria-hidden="true"
                          />
                          <span className="circle-list__name">
                            {node.name}
                          </span>
                          <span className="circle-list__relation">
                            {node.relation}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="circle-aside__tones">
              <p className="meta">关系类型</p>
              <div className="circle-aside__chips">
                {presentTones.map((tone) => (
                  <span key={tone}>
                    <i
                      style={{
                        backgroundColor: CIRCLE_TONE_META[tone].color,
                      }}
                      aria-hidden="true"
                    />
                    {tone}
                  </span>
                ))}
              </div>
            </div>

            <p className="circle-aside__source">
              依据：{circle.sources.join("；")}。关系依常见史料整理；星的远近按关系深浅排布，为阅读示意。
            </p>
          </aside>
        </div>

        <footer className="circle-actions">
          <div>
            <p className="meta">同代人物 · {circle.nodes.length} 位</p>
            <p className="circle-actions__note">
              星图是阅读人物的一种方式，不替代史料里的全部交游。
            </p>
          </div>
          <div className="circle-actions__buttons">
            <Link to="/" className="btn-ghost">
              回书架
            </Link>
            <button type="button" className="btn-ink" onClick={goPlay}>
              {visited > 0 ? "继续重走" : "开始重走"}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
