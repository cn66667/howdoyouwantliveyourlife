import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BasemapMode = "ink" | "terrain";

type MapPrefs = {
  basemap: BasemapMode;
  showProvinces: boolean;
  toggleBasemap: () => void;
  toggleProvinces: () => void;
};

export const useMapPrefs = create<MapPrefs>()(
  persist(
    (set) => ({
      basemap: "terrain",
      showProvinces: false,
      toggleBasemap: () =>
        set((state) => ({
          basemap: state.basemap === "terrain" ? "ink" : "terrain",
        })),
      toggleProvinces: () =>
        set((state) => ({ showProvinces: !state.showProvinces })),
    }),
    {
      name: "xiake-map-prefs",
      version: 3,
      migrate: () =>
        ({ basemap: "terrain", showProvinces: false }) as MapPrefs,
    },
  ),
);
