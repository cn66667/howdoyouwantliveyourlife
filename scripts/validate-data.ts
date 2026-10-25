import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import {
  adminPlaceSchema,
  eraSchema,
  figureCircleSchema,
  figureSchema,
  type Era,
  type Figure,
} from "../src/data/schema";

const FIGURES_DIR = resolve("src/data/figures");
const ERAS_DIR = resolve("src/data/eras");

let errors = 0;
let warnings = 0;

function fail(message: string) {
  errors += 1;
  console.error(`    x ${message}`);
}

function warn(message: string) {
  warnings += 1;
  console.warn(`    ! ${message}`);
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function loadEras(): Map<string, Era> {
  const eras = new Map<string, Era>();
  const files = readdirSync(ERAS_DIR).filter((file) => file.endsWith(".json"));

  if (files.length === 0) {
    console.error("未在 src/data/eras 下找到任何时代数据");
    process.exit(1);
  }

  for (const file of files) {
    const path = join(ERAS_DIR, file);
    let raw: unknown;

    try {
      raw = readJson(path);
    } catch (error) {
      console.error(`\n  时代 ${file}`);
      fail(`JSON 解析失败：${(error as Error).message}`);
      continue;
    }

    const result = eraSchema.safeParse(raw);

    if (!result.success) {
      console.error(`\n  时代 ${file}`);
      for (const issue of result.error.issues) {
        fail(`${issue.path.join(".") || "(root)"}：${issue.message}`);
      }
      continue;
    }

    const era = result.data;
    console.log(`\n  时代 ${era.name}（${era.id}）`);

    if (era.id !== basename(file, ".json")) {
      fail(`文件名 ${file} 与时代 id「${era.id}」不一致`);
    }
    if (era.start >= era.end) {
      fail(`起止年份不合理：${era.start}–${era.end}`);
    }

    const ids = new Set<string>();
    for (const place of era.places) {
      if (ids.has(place.id)) fail(`地点 id 重复：${place.id}`);
      ids.add(place.id);
    }

    console.log(`    地点 ${era.places.length} 个`);

    if (!eras.has(era.id)) eras.set(era.id, era);
  }

  return eras;
}

function checkFigure(figure: Figure, source: string, eras: Map<string, Era>) {
  console.log(`\n  ${figure.name}（${figure.id}）· ${source}`);

  if (figure.birth >= figure.death) {
    fail(`生年 ${figure.birth} 应早于卒年 ${figure.death}`);
  }

  const era = eras.get(figure.eraId);

  if (!era) {
    fail(`eraId「${figure.eraId}」没有对应的时代数据`);
  } else {
    if (figure.dynasty !== era.name) {
      warn(`dynasty「${figure.dynasty}」与时代「${era.name}」不一致`);
    }
    if (figure.death < era.start || figure.birth > era.end) {
      warn(
        `生卒 ${figure.birth}–${figure.death} 与时代区间 ${era.start}–${era.end} 无交集`,
      );
    }
  }

  const placeIds = new Set(era?.places.map((place) => place.id) ?? []);
  const usedPlaceIds = new Set<string>();
  const ids = new Set<string>();
  let lastAge = -1;
  let lastYear = -Infinity;
  let lastAct = 0;

  for (const event of figure.route) {
    const at = `${event.year} ${event.title}`;

    if (ids.has(event.id)) fail(`${at}：事件 id 重复（${event.id}）`);
    ids.add(event.id);

    if (event.year < figure.birth || event.year > figure.death) {
      fail(`${at}：年份不在 ${figure.birth}–${figure.death} 之间`);
    }
    if (event.age !== event.year - figure.birth) {
      warn(
        `${at}：年龄 ${event.age} 与公元年推算不符（应为 ${event.year - figure.birth}）`,
      );
    }
    if (event.age <= lastAge) fail(`${at}：年龄未严格递增（上一站 ${lastAge}）`);
    if (event.year < lastYear) fail(`${at}：年份早于上一站（上一站 ${lastYear}）`);
    if (event.act < lastAct) fail(`${at}：幕次倒退（上一站第 ${lastAct} 幕）`);

    lastAge = event.age;
    lastYear = event.year;
    lastAct = event.act;

    if (!placeIds.has(event.placeId)) {
      fail(`${at}：placeId「${event.placeId}」在 ${figure.eraId} 地点库中不存在`);
    }
    usedPlaceIds.add(event.placeId);

    if (event.refs.length === 0) fail(`${at}：缺少出处`);

    if (event.quote) {
      if (event.quote.status === "pending") {
        warn(`${at}：引文待校对（${event.quote.work}）`);
      }
      if (event.quote.text.includes("待补") || event.quote.text.includes("TODO")) {
        fail(`${at}：引文仍是占位文本`);
      }
    }

    if (event.choice) {
      const labels = new Set(event.choice.options.map((option) => option.text));
      if (labels.size !== event.choice.options.length) {
        fail(`${at}：抉择选项文案重复`);
      }
    }
  }

  const acts = new Set(figure.route.map((event) => event.act));
  for (const act of figure.acts) {
    if (!acts.has(act.id)) warn(`第 ${act.id} 幕「${act.title}」没有对应事件`);
  }

  const quotes = figure.route.filter((event) => event.quote);
  const pending = quotes.filter((event) => event.quote?.status === "pending");
  const unused =
    era?.places.filter((place) => !usedPlaceIds.has(place.id)).length ?? 0;

  console.log(
    `    事件 ${figure.route.length} · 抉择 ${
      figure.route.filter((event) => event.choice).length
    } · 引文 ${quotes.length}（待校 ${pending.length}）· 未用地点 ${unused}`,
  );
}

function checkAdminPlaces(eras: Map<string, Era>) {
  for (const eraId of ["tang", "ming", "qing", "republic"]) {
    const path = resolve(`src/data/eras/${eraId}/admin-places.json`);
    if (!existsSync(path)) continue;

    const era = eras.get(eraId);
    console.log(`\n  ${era?.name ?? eraId} · 历史地名`);

    let raw: unknown;

    try {
      raw = readJson(path);
    } catch (error) {
      fail(`admin-places.json 解析失败：${(error as Error).message}`);
      continue;
    }

    const result = adminPlaceSchema.array().safeParse(raw);

    if (!result.success) {
      for (const issue of result.error.issues) {
        fail(`${issue.path.join(".") || "(root)"}：${issue.message}`);
      }
      continue;
    }

    const ids = new Set<string>();
    for (const place of result.data) {
      if (ids.has(place.id)) fail(`地名 id 重复：${place.id}`);
      ids.add(place.id);
    }

    const major = result.data.filter((place) => place.rank === 1).length;
    console.log(
      `    地名 ${result.data.length} 个（主要 ${major} 个，次级 ${
        result.data.length - major
      } 个）`,
    );
  }
}

function checkCircles(figureNames: Map<string, string>) {
  const path = resolve("src/data/circles.json");
  console.log("\n  朋友圈 · 人物星图");

  if (!existsSync(path)) {
    fail("找不到 src/data/circles.json");
    return;
  }

  let raw: unknown;

  try {
    raw = readJson(path);
  } catch (error) {
    fail(`circles.json 解析失败：${(error as Error).message}`);
    return;
  }

  const result = figureCircleSchema.array().safeParse(raw);

  if (!result.success) {
    for (const issue of result.error.issues) {
      fail(`${issue.path.join(".") || "(root)"}：${issue.message}`);
    }
    return;
  }

  const seen = new Set<string>();

  for (const circle of result.data) {
    const center = figureNames.get(circle.figureId);

    if (!center) {
      fail(`figureId「${circle.figureId}」没有对应的人物`);
    }
    if (seen.has(circle.figureId)) {
      fail(`figureId「${circle.figureId}」的朋友圈重复`);
    }
    seen.add(circle.figureId);

    const ids = new Set<string>();
    const names = new Set<string>();

    for (const node of circle.nodes) {
      if (ids.has(node.id)) fail(`${center ?? circle.figureId}：星图人物 id 重复（${node.id}）`);
      ids.add(node.id);

      if (names.has(node.name)) fail(`${center ?? circle.figureId}：星图人物重名（${node.name}）`);
      names.add(node.name);

      if (node.name === center) {
        fail(`${center ?? circle.figureId}：星图中不应重复出现中心人物`);
      }
    }

    const tones = [...new Set(circle.nodes.map((node) => node.tone))];
    console.log(
      `    ${center ?? circle.figureId}：${circle.nodes.length} 位（${tones.join("、")}）`,
    );
  }

  for (const [id, name] of figureNames) {
    if (!seen.has(id)) fail(`${name}（${id}）缺少朋友圈数据`);
  }
}

const eras = loadEras();
checkAdminPlaces(eras);
const files = readdirSync(FIGURES_DIR).filter((file) => file.endsWith(".json"));
const figureNames = new Map<string, string>();

if (files.length === 0) {
  console.error("未在 src/data/figures 下找到任何人物的 JSON 数据");
  process.exit(1);
}

for (const file of files) {
  const path = join(FIGURES_DIR, file);
  let raw: unknown;

  try {
    raw = readJson(path);
  } catch (error) {
    console.error(`\n  ${file}`);
    fail(`JSON 解析失败：${(error as Error).message}`);
    continue;
  }

  const result = figureSchema.safeParse(raw);

  if (!result.success) {
    console.error(`\n  ${file}`);
    for (const issue of result.error.issues) {
      fail(`${issue.path.join(".") || "(root)"}：${issue.message}`);
    }
    continue;
  }

  const figure = result.data;
  const expectedId = basename(file, ".json");

  if (figure.id !== expectedId) {
    fail(`文件名 ${file} 与人物的 id「${figure.id}」不一致`);
  }

  checkFigure(figure, file, eras);
  figureNames.set(figure.id, figure.name);
}

checkCircles(figureNames);

console.log(
  `\n${errors === 0 ? "通过" : "未通过"}：${errors} 个错误，${warnings} 个警告。`,
);

if (errors > 0) process.exitCode = 1;
