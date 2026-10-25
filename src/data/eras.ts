import rawMing from "./eras/ming.json";
import rawQing from "./eras/qing.json";
import rawRepublic from "./eras/republic.json";
import rawTang from "./eras/tang.json";
import rawMingPlaces from "./eras/ming/admin-places.json";
import rawQingPlaces from "./eras/qing/admin-places.json";
import rawRepublicPlaces from "./eras/republic/admin-places.json";
import rawTangPlaces from "./eras/tang/admin-places.json";
import {
  adminPlaceSchema,
  eraSchema,
  type AdminPlace,
  type Era,
  type Figure,
  type LifeEvent,
  type NamedPlace,
} from "./schema";

const parsedEras: Era[] = [rawTang, rawMing, rawQing, rawRepublic].map((raw) =>
  eraSchema.parse(raw),
);

const parsedAdminPlaces: Record<string, AdminPlace[]> = {
  tang: adminPlaceSchema.array().parse(rawTangPlaces),
  ming: adminPlaceSchema.array().parse(rawMingPlaces),
  qing: adminPlaceSchema.array().parse(rawQingPlaces),
  republic: adminPlaceSchema.array().parse(rawRepublicPlaces),
};

export const eras = parsedEras;

export function getEra(id: string | undefined): Era | undefined {
  if (!id) return undefined;
  return eras.find((era) => era.id === id);
}

export function getAdminPlaces(eraId: string): AdminPlace[] {
  return parsedAdminPlaces[eraId] ?? [];
}

export type ResolvedEvent = LifeEvent & { place: NamedPlace };

export function resolveRoute(figure: Figure): ResolvedEvent[] {
  const era = getEra(figure.eraId);

  if (!era) {
    throw new Error(`找不到时代数据：${figure.eraId}`);
  }

  return figure.route.map((event) => {
    const place = era.places.find((item) => item.id === event.placeId);

    if (!place) {
      throw new Error(`找不到地点数据：${event.placeId}`);
    }

    return { ...event, place };
  });
}
