import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type NeFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
};

type NeCollection = {
  type: "FeatureCollection";
  features: NeFeature[];
};

const SOURCES = [
  "https://fastly.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_1_states_provinces.geojson",
  "https://gcore.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_1_states_provinces.geojson",
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_1_states_provinces.geojson",
];

const OUT_DIR = resolve("src/data/geo");

function roundCoordinates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(roundCoordinates);
  if (typeof value === "number") return Math.round(value * 10000) / 10000;
  return value;
}

async function loadSource(): Promise<NeCollection> {
  let lastError = "";

  for (const url of SOURCES) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = `${url} -> HTTP ${response.status}`;
        continue;
      }
      const data = (await response.json()) as NeCollection;
      if (!Array.isArray(data.features) || data.features.length === 0) {
        lastError = `${url} -> 空数据`;
        continue;
      }
      console.log(`source: ${url}`);
      return data;
    } catch (error) {
      lastError = `${url} -> ${(error as Error).message}`;
    }
  }

  throw new Error(`Natural Earth 下载失败：${lastError}`);
}

const source = await loadSource();
const china = source.features.filter(
  (feature) => feature.properties.adm0_a3 === "CHN",
);

if (china.length === 0) {
  throw new Error("没有筛选到中国省级要素");
}

const provinces = {
  type: "FeatureCollection" as const,
  features: china.map((feature, index) => ({
    type: "Feature" as const,
    id: index + 1,
    properties: {
      id: String(feature.properties.iso_3166_2 ?? ""),
      name: String(feature.properties.name_zh ?? feature.properties.name ?? ""),
      nameEn: String(feature.properties.name ?? ""),
    },
    geometry: {
      type: feature.geometry.type,
      coordinates: roundCoordinates(feature.geometry.coordinates),
    },
  })),
};

const labels = china
  .map((feature) => ({
    id: String(feature.properties.iso_3166_2 ?? ""),
    name: String(feature.properties.name_zh ?? feature.properties.name ?? ""),
    lng: Number(feature.properties.longitude),
    lat: Number(feature.properties.latitude),
    weight: Number(feature.properties.area_sqkm ?? 0),
  }))
  .filter(
    (item) =>
      item.name.length > 0 &&
      Number.isFinite(item.lng) &&
      Number.isFinite(item.lat),
  )
  .sort((a, b) => a.id.localeCompare(b.id));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  resolve(OUT_DIR, "china-provinces.json"),
  JSON.stringify(provinces),
);
writeFileSync(
  resolve(OUT_DIR, "province-labels.json"),
  JSON.stringify(labels),
);

const bytes =
  Buffer.byteLength(JSON.stringify(provinces)) +
  Buffer.byteLength(JSON.stringify(labels));

console.log(
  `provinces: ${provinces.features.length} · labels: ${labels.length} · ${Math.round(
    (bytes / 1024) * 10,
  ) / 10} KB`,
);
