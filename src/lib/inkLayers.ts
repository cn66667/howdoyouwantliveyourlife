import type { LayerSpecification } from "maplibre-gl";
import type { ResolvedEvent } from "../data/eras";

export const ROUTE_SOURCE = "xiake-route";
export const SEEN_SOURCE = "xiake-route-seen";

type Position = [number, number];
type RouteCollection = GeoJSON.FeatureCollection<GeoJSON.LineString>;

function lineString(coordinates: Position[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates },
  };
}

function collection(features: GeoJSON.Feature<GeoJSON.LineString>[]): RouteCollection {
  return { type: "FeatureCollection", features };
}

function positionsOf(events: ResolvedEvent[]): Position[] {
  return events.map((event) => [event.place.lng, event.place.lat]);
}

export function fullRouteData(events: ResolvedEvent[]): RouteCollection {
  if (events.length < 2) return collection([]);
  return collection([lineString(positionsOf(events))]);
}

export function seenRouteData(
  events: ResolvedEvent[],
  reachedIndex: number,
): RouteCollection {
  const end = Math.min(Math.max(reachedIndex + 1, 0), events.length);
  if (end < 2) return collection([]);
  return collection([lineString(positionsOf(events.slice(0, end)))]);
}

export const routeLayers: LayerSpecification[] = [
  {
    id: "route-all-halo",
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#3a332a",
      "line-width": 5,
      "line-opacity": 0.05,
      "line-blur": 2.5,
    },
  },
  {
    id: "route-all",
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#3a332a",
      "line-width": 1.2,
      "line-opacity": 0.26,
      "line-dasharray": [2, 3],
    },
  },
  {
    id: "route-seen-halo",
    type: "line",
    source: SEEN_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#3a332a",
      "line-width": 5.5,
      "line-opacity": 0.12,
      "line-blur": 2.5,
    },
  },
  {
    id: "route-seen",
    type: "line",
    source: SEEN_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#3a332a",
      "line-width": 2.1,
      "line-opacity": 0.9,
    },
  },
];
