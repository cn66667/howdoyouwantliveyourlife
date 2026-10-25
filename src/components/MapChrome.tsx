import type { BasemapMode } from "../game/mapPrefs";
import { CompassRose } from "./CompassRose";
import { Seal } from "./Seal";

type MapChromeProps = {
  eraName: string;
  basemap: BasemapMode;
  showProvinces: boolean;
  hasKey: boolean;
  onToggleBasemap: () => void;
  onToggleProvinces: () => void;
};

export function MapChrome({
  eraName,
  basemap,
  showProvinces,
  hasKey,
  onToggleBasemap,
  onToggleProvinces,
}: MapChromeProps) {
  const note = [
    eraName,
    basemap === "terrain" ? "地形底图" : "舆图",
    "地名示意",
    showProvinces ? "现代省界参照" : null,
    "不表示历史疆域",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="map-chrome pointer-events-none absolute inset-0 z-[3]">
      <div aria-hidden="true" className="map-chrome__grain" />
      <div aria-hidden="true" className="map-chrome__frame" />

      <div
        aria-hidden="true"
        className="map-chrome__corner map-chrome__corner--tl"
      />
      <div
        aria-hidden="true"
        className="map-chrome__corner map-chrome__corner--tr"
      />
      <div
        aria-hidden="true"
        className="map-chrome__corner map-chrome__corner--bl"
      />
      <div
        aria-hidden="true"
        className="map-chrome__corner map-chrome__corner--br"
      />

      <div aria-hidden="true" className="map-chrome__cartouche">
        <Seal text="霞客" className="h-5 w-5 text-[9px]" />
        <span className="map-chrome__cartouche-text">万里遐征</span>
      </div>

      <div aria-hidden="true" className="map-chrome__compass">
        <CompassRose />
      </div>

      <button
        type="button"
        onClick={onToggleBasemap}
        title={basemap === "terrain" ? "切换回纸本舆图" : "切换到地形底图"}
        className="map-chrome__mode pointer-events-auto"
      >
        {basemap === "terrain" ? "舆图" : "地形"}
      </button>

      <button
        type="button"
        onClick={onToggleProvinces}
        aria-pressed={showProvinces}
        title={
          hasKey
            ? "叠加现代省级行政区参照"
            : "叠加 Natural Earth 省界预览（非标准地图）"
        }
        className={`map-chrome__provinces pointer-events-auto ${
          showProvinces ? "is-active" : ""
        }`}
      >
        省界
      </button>

      <div aria-hidden="true" className="map-chrome__waves" />

      <p className="map-chrome__note">
        <span aria-hidden="true" className="map-chrome__legend-dot" />
        {note}
      </p>
    </div>
  );
}
