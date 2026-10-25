import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FigureProgress = {
  visited: string[];
  choices: Record<string, number>;
};

type JourneyState = {
  activeFigureId: string | null;
  progress: Record<string, FigureProgress>;
  start: (figureId: string) => void;
  markVisited: (eventIds: string[]) => void;
  choose: (eventId: string, option: number) => void;
  reset: (figureId: string) => void;
};

type PersistedV1 = {
  figureId?: string | null;
  visited?: string[];
  choices?: Record<string, number>;
};

const emptyProgress = (): FigureProgress => ({ visited: [], choices: {} });

export const useJourney = create<JourneyState>()(
  persist(
    (set) => ({
      activeFigureId: null,
      progress: {},
      start: (figureId) =>
        set((state) => ({
          activeFigureId: figureId,
          progress: state.progress[figureId]
            ? state.progress
            : { ...state.progress, [figureId]: emptyProgress() },
        })),
      markVisited: (eventIds) =>
        set((state) => {
          const active = state.activeFigureId;
          if (!active) return state;

          const current = state.progress[active] ?? emptyProgress();
          const next = new Set(current.visited);
          let changed = false;

          for (const eventId of eventIds) {
            if (!next.has(eventId)) {
              next.add(eventId);
              changed = true;
            }
          }

          if (!changed) return state;

          return {
            progress: {
              ...state.progress,
              [active]: { ...current, visited: [...next] },
            },
          };
        }),
      choose: (eventId, option) =>
        set((state) => {
          const active = state.activeFigureId;
          if (!active) return state;

          const current = state.progress[active] ?? emptyProgress();

          return {
            progress: {
              ...state.progress,
              [active]: {
                ...current,
                choices: { ...current.choices, [eventId]: option },
              },
            },
          };
        }),
      reset: (figureId) =>
        set((state) => {
          const progress = { ...state.progress };
          delete progress[figureId];

          return {
            progress,
            activeFigureId:
              state.activeFigureId === figureId ? null : state.activeFigureId,
          };
        }),
    }),
    {
      name: "xiake-journey",
      version: 2,
      migrate: (persisted) => {
        const old = persisted as PersistedV1 | undefined;

        if (old?.figureId) {
          return {
            activeFigureId: old.figureId,
            progress: {
              [old.figureId]: {
                visited: old.visited ?? [],
                choices: old.choices ?? {},
              },
            },
          } as JourneyState;
        }

        return { activeFigureId: null, progress: {} } as JourneyState;
      },
    },
  ),
);
