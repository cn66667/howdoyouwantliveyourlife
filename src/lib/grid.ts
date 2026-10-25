import type { LayerSpecification } from "maplibre-gl";

export const GRID_SOURCE = "xiake-grid";
export const GRID_LAYER_ID = "xiake-grid-lines";

type Position = [number, number];

function line(coordinates: Position[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates },
  };
}

export function gridData(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const west = 94;
  const east = 126;
  const south = 17;
  const north = 44;
  const step = 2;
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  for (let lng = west; lng <= east; lng += step) {
    features.push(line([[lng, south], [lng, north]]));
  }
  for (let lat = south; lat <= north; lat += step) {
    features.push(line([[west, lat], [east, lat]]));
  }

  return { type: "FeatureCollection", features };
}

export const gridLayer: LayerSpecification = {
  id: GRID_LAYER_ID,
  type: "line",
  source: GRID_SOURCE,
  paint: {
    "line-color": "#3a332a",
    "line-width": 0.55,
    "line-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      0.035,
      4.5,
      0.075,
      6,
      0.1,
      8,
      0.12,
    ],
  },
};
