import rawDufu from "./figures/dufu.json";
import rawLinzexu from "./figures/linzexu.json";
import rawLuxun from "./figures/luxun.json";
import rawWangyangming from "./figures/wangyangming.json";
import rawXuxiake from "./figures/xuxiake.json";
import { figureSchema, type Figure } from "./schema";

const parsed: Figure[] = [
  rawDufu,
  rawXuxiake,
  rawWangyangming,
  rawLinzexu,
  rawLuxun,
].map((raw) => figureSchema.parse(raw));

export const figures = parsed;

export function getFigure(id: string | undefined): Figure | undefined {
  if (!id) return undefined;
  return parsed.find((figure) => figure.id === id);
}
