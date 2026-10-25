import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ResolvedEvent } from "../data/eras";
import type { AdminPlace } from "../data/schema";
import type { BasemapMode } from "../game/mapPrefs";
import { GRID_LAYER_ID, GRID_SOURCE, gridData, gridLayer } from "../lib/grid";
import {
  ROUTE_SOURCE,
  SEEN_SOURCE,
  fullRouteData,
  routeLayers,
  seenRouteData,
} from "../lib/inkLayers";
import { createMapStyle, hasTiandituKey } from "../lib/mapStyle";
import {
  MODERN_FILL_LAYER,
  MODERN_LINE_LAYER,
  MODERN_SOURCE,
  modernCities,
  modernData,
  modernLayers,
  provinceLabels,
} from "../lib/modernLayer";

type InkMapProps = {
  events: ResolvedEvent[];
  adminPlaces: AdminPlace[];
  basemap: BasemapMode;
  showProvinces: boolean;
  activeId?: string;
  visited?: string[];
  reachedIndex?: number;
  onSelect?: (eventId: string) => void;
  className?: string;
};

type MapLabel = {
  element: HTMLElement;
  group: "modern" | "admin";
  minZoom: number;
  weight: number;
};

export function InkMap({
  events,
  adminPlaces,
  basemap,
  showProvinces,
  activeId,
  visited = [],
  reachedIndex = -1,
  onSelect,
  className = "",
}: InkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(
    new Map<string, { element: HTMLButtonElement; eventIds: string[] }>(),
  );
  const labelsRef = useRef<MapLabel[]>([]);
  const inkObstaclesRef = useRef<HTMLElement[]>([]);
  const onSelectRef = useRef(onSelect);
  const reachedIndexRef = useRef(reachedIndex);
  const basemapRef = useRef(basemap);
  const provincesRef = useRef(showProvinces);
  const refreshRef = useRef<() => void>(() => {});
  const layoutRef = useRef<() => void>(() => {});
  const clearHoverRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);

  onSelectRef.current = onSelect;
  reachedIndexRef.current = reachedIndex;
  basemapRef.current = basemap;
  provincesRef.current = showProvinces;

  const refreshVisibility = () => {
    const map = mapRef.current;
    if (!map) return;

    const terrain = basemapRef.current === "terrain";
    const provinces = provincesRef.current;

    if (containerRef.current) {
      containerRef.current.dataset.basemap = basemapRef.current;
      containerRef.current.dataset.provinces = provinces ? "on" : "off";
    }

    const setLayer = (id: string, visible: boolean) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    };

    setLayer("tianditu-ter", terrain && hasTiandituKey);
    setLayer("tianditu-vec", provinces && hasTiandituKey);
    setLayer(GRID_LAYER_ID, !terrain && !provinces);
    setLayer(MODERN_FILL_LAYER, provinces && !hasTiandituKey);
    setLayer(MODERN_LINE_LAYER, provinces && !hasTiandituKey);

    if (map.getLayer("tianditu-vec")) {
      map.setPaintProperty(
        "tianditu-vec",
        "raster-opacity",
        terrain ? 0.35 : 0.55,
      );
    }

    if (!provinces || hasTiandituKey) {
      clearHoverRef.current();
    }
  };

  const layoutLabels = () => {
    const map = mapRef.current;
    if (!map) return;

    const modernOn = provincesRef.current && !hasTiandituKey;
    const zoom = map.getZoom();

    if (containerRef.current) {
      containerRef.current.dataset.zoom = zoom.toFixed(2);
    }

    for (const label of labelsRef.current) {
      label.element.classList.add("is-hidden");
    }

    const candidates = labelsRef.current
      .filter(
        (label) =>
          (label.group === "admin" || modernOn) && zoom >= label.minZoom,
      )
      .sort((a, b) => b.weight - a.weight);

    const chromeObstacles = [
      ".map-chrome__cartouche",
      ".map-chrome__compass",
      ".map-chrome__mode",
      ".map-chrome__provinces",
      ".map-chrome__note",
    ]
      .map((selector) => document.querySelector(selector))
      .filter((element): element is Element => element !== null);

    const placed: Array<{
      left: number;
      right: number;
      top: number;
      bottom: number;
    }> = [...inkObstaclesRef.current, ...chromeObstacles]
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({
        left: rect.left - 4,
        right: rect.right + 4,
        top: rect.top - 4,
        bottom: rect.bottom + 4,
      }));

    const mapRect = map.getContainer().getBoundingClientRect();
    const maxLabels = map.getContainer().clientWidth < 480 ? 14 : 26;
    let accepted = 0;

    for (const label of candidates) {
      if (accepted >= maxLabels) break;

      const rect = label.element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      if (
        rect.left < mapRect.left + 8 ||
        rect.right > mapRect.right - 8 ||
        rect.top < mapRect.top + 8 ||
        rect.bottom > mapRect.bottom - 8
      ) {
        continue;
      }

      const box = {
        left: rect.left - 3,
        right: rect.right + 3,
        top: rect.top - 2,
        bottom: rect.bottom + 2,
      };

      const overlaps = placed.some(
        (other) =>
          !(
            box.right < other.left ||
            box.left > other.right ||
            box.bottom < other.top ||
            box.top > other.bottom
          ),
      );

      if (overlaps) continue;

      label.element.classList.remove("is-hidden");
      placed.push(box);
      accepted += 1;
    }
  };

  refreshRef.current = refreshVisibility;
  layoutRef.current = layoutLabels;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setReady(false);
    let cancelled = false;
    const markers = new Map<
      string,
      { element: HTMLButtonElement; eventIds: string[] }
    >();
    markersRef.current = markers;
    labelsRef.current = [];
    inkObstaclesRef.current = [];

    const map = new MapLibreMap({
      container,
      style: createMapStyle(),
      center: [112, 30],
      zoom: 4,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      renderWorldCopies: false,
    });
    mapRef.current = map;

    map.addControl(
      new NavigationControl({ showCompass: false }),
      "bottom-right",
    );

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);

    let layoutFrame = 0;
    const scheduleLayout = () => {
      if (layoutFrame !== 0) return;
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = 0;
        layoutRef.current();
      });
    };

    map.on("move", scheduleLayout);
    map.on("zoom", scheduleLayout);

    map.on("load", () => {
      if (cancelled) return;

      map.addSource(MODERN_SOURCE, {
        type: "geojson",
        data: modernData,
      });
      for (const layer of modernLayers) {
        map.addLayer(layer);
      }

      let hoveredProvince: string | number | null = null;
      const clearHover = () => {
        if (hoveredProvince !== null) {
          map.setFeatureState(
            { source: MODERN_SOURCE, id: hoveredProvince },
            { hover: false },
          );
          hoveredProvince = null;
        }
        map.getCanvas().style.cursor = "";
      };
      clearHoverRef.current = clearHover;

      map.on("mousemove", MODERN_FILL_LAYER, (event) => {
        const id = event.features?.[0]?.id;
        if (id === undefined) return;

        if (hoveredProvince !== null && hoveredProvince !== id) {
          map.setFeatureState(
            { source: MODERN_SOURCE, id: hoveredProvince },
            { hover: false },
          );
        }

        hoveredProvince = id;
        map.setFeatureState({ source: MODERN_SOURCE, id }, { hover: true });
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", MODERN_FILL_LAYER, clearHover);

      map.addSource(GRID_SOURCE, {
        type: "geojson",
        data: gridData(),
      });
      map.addLayer(gridLayer);

      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: fullRouteData(events),
      });
      map.addSource(SEEN_SOURCE, {
        type: "geojson",
        data: seenRouteData(events, reachedIndexRef.current),
      });

      for (const layer of routeLayers) {
        map.addLayer(layer);
      }

      if (events.length > 0) {
        const bounds = new LngLatBounds();
        for (const event of events) {
          bounds.extend([event.place.lng, event.place.lat]);
        }
        map.fitBounds(bounds, {
          padding: 56,
          maxZoom: 5.6,
          duration: 0,
        });
      }

      const placeGroups = new Map<
        string,
        { place: ResolvedEvent["place"]; eventIds: string[] }
      >();

      for (const event of events) {
        const group = placeGroups.get(event.placeId);
        if (group) {
          group.eventIds.push(event.id);
        } else {
          placeGroups.set(event.placeId, {
            place: event.place,
            eventIds: [event.id],
          });
        }
      }

      for (const [placeId, group] of placeGroups) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "ink-marker";
        element.dataset.placeId = placeId;
        element.dataset.eventId = group.eventIds[0];
        element.dataset.placement = group.place.labelPlacement;
        element.setAttribute(
          "aria-label",
          `${group.place.ancient}，${group.eventIds.length} 个节点`,
        );

        const dot = document.createElement("span");
        dot.className = "ink-marker__dot";

        const label = document.createElement("span");
        label.className = "ink-marker__label";
        label.textContent = group.place.ancient;

        element.append(dot, label);
        element.addEventListener("click", () => {
          onSelectRef.current?.(group.eventIds[0]);
        });

        new Marker({ element, anchor: "center" })
          .setLngLat([group.place.lng, group.place.lat])
          .addTo(map);

        markers.set(placeId, { element, eventIds: group.eventIds });
        inkObstaclesRef.current.push(element, label);
      }

      for (const place of adminPlaces) {
        const element = document.createElement("div");
        element.className = `admin-label ${
          place.rank === 1 ? "admin-label--major" : "admin-label--minor"
        } is-hidden`;
        if (place.seat) {
          element.title = `${place.name} · 治所 ${place.seat}`;
        }

        const dot = document.createElement("span");
        dot.className = "admin-label__dot";

        const text = document.createElement("span");
        text.className = "admin-label__text";
        text.textContent = place.name;

        element.append(dot, text);
        new Marker({ element, anchor: "center" })
          .setLngLat([place.lng, place.lat])
          .addTo(map);

        labelsRef.current.push({
          element,
          group: "admin",
          minZoom: place.rank === 1 ? 2.8 : 4.8,
          weight: place.rank === 1 ? 6_000_000 : 3_500_000,
        });
      }

      if (!hasTiandituKey) {
        const addModernLabel = (
          item: { name: string; lng: number; lat: number },
          kind: "province" | "city",
          minZoom: number,
          weight: number,
        ) => {
          const element = document.createElement("div");
          element.className = `modern-label modern-label--${kind} is-hidden`;

          if (kind === "city") {
            const dot = document.createElement("span");
            dot.className = "modern-label__dot";
            const text = document.createElement("span");
            text.className = "modern-label__text";
            text.textContent = item.name;
            element.append(dot, text);
          } else {
            element.textContent = item.name;
          }

          new Marker({ element, anchor: "center" })
            .setLngLat([item.lng, item.lat])
            .addTo(map);

          labelsRef.current.push({
            element,
            group: "modern",
            minZoom,
            weight,
          });
        };

        for (const label of provinceLabels) {
          addModernLabel(label, "province", 2.9, label.weight);
        }
        for (const city of modernCities) {
          addModernLabel(
            city,
            "city",
            city.rank === 1 ? 4.8 : 5.4,
            city.rank === 1 ? 3_000_000 : 2_400_000,
          );
        }
      }

      refreshRef.current();
      layoutRef.current();
      setReady(true);
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (layoutFrame !== 0) cancelAnimationFrame(layoutFrame);
      markers.clear();
      markersRef.current = new Map();
      labelsRef.current = [];
      inkObstaclesRef.current = [];
      clearHoverRef.current = () => {};
      map.remove();
      mapRef.current = null;
    };
  }, [events, adminPlaces]);

  useEffect(() => {
    if (!ready) return;
    refreshRef.current();
    layoutRef.current();
  }, [ready, basemap, showProvinces]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource(SEEN_SOURCE) as GeoJSONSource | undefined;
    source?.setData(seenRouteData(events, reachedIndex));
  }, [ready, events, reachedIndex]);

  useEffect(() => {
    if (!ready) return;

    const seen = new Set(visited);
    const activePlaceId = events.find((event) => event.id === activeId)?.placeId;

    for (const [placeId, marker] of markersRef.current) {
      const isVisited = marker.eventIds.some((eventId) => seen.has(eventId));
      marker.element.classList.toggle("is-visited", isVisited);
      marker.element.classList.toggle("is-active", placeId === activePlaceId);
    }
  }, [ready, activeId, visited, events]);

  useEffect(() => {
    if (!ready || !activeId) return;
    const map = mapRef.current;
    const event = events.find((item) => item.id === activeId);
    if (!map || !event) return;

    map.flyTo({
      center: [event.place.lng, event.place.lat],
      zoom: 5.8,
      duration: 1100,
      essential: true,
    });
  }, [ready, activeId, events]);

  return (
    <div
      ref={containerRef}
      className={`ink-map ${className}`}
      role="region"
      aria-label="行程舆图"
    />
  );
}
