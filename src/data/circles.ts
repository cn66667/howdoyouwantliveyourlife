import rawCircles from "./circles.json";
import {
  figureCircleSchema,
  type CircleTone,
  type FigureCircle,
} from "./schema";

const parsed: FigureCircle[] = figureCircleSchema.array().parse(rawCircles);

export const figureCircles = parsed;

export function getCircle(figureId: string | undefined): FigureCircle | undefined {
  if (!figureId) return undefined;
  return parsed.find((circle) => circle.figureId === figureId);
}

export const CIRCLE_TONE_ORDER: CircleTone[] = [
  "知己",
  "同道",
  "同僚",
  "君臣",
  "师友",
  "亲族",
  "对手",
];

export const CIRCLE_TONE_META: Record<
  CircleTone,
  { label: CircleTone; color: string }
> = {
  知己: { label: "知己", color: "#d8b46a" },
  同道: { label: "同道", color: "#9fb8a4" },
  同僚: { label: "同僚", color: "#b9c7d6" },
  君臣: { label: "君臣", color: "#c9b7a4" },
  师友: { label: "师友", color: "#d9a77c" },
  亲族: { label: "亲族", color: "#d78f8a" },
  对手: { label: "对手", color: "#8f9aa8" },
};
