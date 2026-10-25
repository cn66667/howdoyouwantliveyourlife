import type {
  ExpressionSpecification,
  LayerSpecification,
} from "maplibre-gl";
import provinces from "../data/geo/china-provinces.json";
import provinceLabelsRaw from "../data/geo/province-labels.json";
import citiesRaw from "../data/geo/modern-cities.json";

export const MODERN_SOURCE = "modern-provinces";
export const MODERN_FILL_LAYER = "modern-provinces-fill";
export const MODERN_LINE_LAYER = "modern-provinces-line";

export type ProvinceLabel = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  weight: number;
};

export type ModernCity = {
  name: string;
  lng: number;
  lat: number;
  rank: number;
};

export const modernData = provinces as unknown as GeoJSON.FeatureCollection;
export const provinceLabels: ProvinceLabel[] = provinceLabelsRaw;
export const modernCities: ModernCity[] = citiesRaw;

const HOVER: ExpressionSpecification = [
  "boolean",
  ["feature-state", "hover"],
  false,
];

export const modernLayers: LayerSpecification[] = [
  {
    id: MODERN_FILL_LAYER,
    type: "fill",
    source: MODERN_SOURCE,
    paint: {
      "fill-color": "#e0d1b4",
      "fill-opacity": ["case", HOVER, 0.72, 0.5],
    },
  },
  {
    id: MODERN_LINE_LAYER,
    type: "line",
    source: MODERN_SOURCE,
    paint: {
      "line-color": ["case", HOVER, "#a5382a", "#4a4136"],
      "line-width": ["case", HOVER, 2, 1.2],
      "line-opacity": ["case", HOVER, 1, 0.6],
    },
  },
];
