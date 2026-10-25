import type { StyleSpecification } from "maplibre-gl";

export const PAPER_COLOR = "#f4ecdc";

const TIANDITU_KEY = import.meta.env.VITE_TIANDITU_KEY ?? "";

export const hasTiandituKey = TIANDITU_KEY.length > 0;

function wmtsTiles(layer: string): string[] {
  return ["0", "1", "2", "3", "4", "5", "6", "7"].map(
    (subdomain) =>
      `https://t${subdomain}.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_KEY}`,
  );
}

export function createMapStyle(): StyleSpecification {
  const sources: StyleSpecification["sources"] = {};
  const layers: StyleSpecification["layers"] = [
    {
      id: "paper",
      type: "background",
      paint: { "background-color": PAPER_COLOR },
    },
  ];

  if (hasTiandituKey) {
    sources.tiandituTer = {
      type: "raster",
      tiles: wmtsTiles("ter"),
      tileSize: 256,
      attribution: "© 天地图",
    };
    sources.tiandituVec = {
      type: "raster",
      tiles: wmtsTiles("vec"),
      tileSize: 256,
    };

    layers.push(
      {
        id: "tianditu-ter",
        type: "raster",
        source: "tiandituTer",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 0.92 },
      },
      {
        id: "tianditu-vec",
        type: "raster",
        source: "tiandituVec",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 0.35 },
      },
    );
  }

  return {
    version: 8,
    name: "霞客行 · 地形",
    sources,
    layers,
  };
}
