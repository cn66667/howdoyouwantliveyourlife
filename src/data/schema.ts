import { z } from "zod";

export const placeSchema = z.object({
  ancient: z.string().min(1),
  modern: z.string().min(1),
  lng: z.number().min(73, "经度超出范围").max(146, "经度超出范围"),
  lat: z.number().min(18, "纬度超出范围").max(54, "纬度超出范围"),
});

export const namedPlaceSchema = placeSchema.extend({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, "地点 id 只能使用小写字母、数字与连字符"),
  labelPlacement: z.enum(["top", "bottom", "left", "right"]).default("top"),
});

export const eraSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  start: z.number().int(),
  end: z.number().int(),
  basemap: z.enum(["paper", "terrain"]),
  skin: z.object({
    paper: z.string().min(1),
    accent: z.string().min(1),
    seal: z.string().min(1),
  }),
  places: z.array(namedPlaceSchema).min(1),
});

export const adminPlaceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  seat: z.string().min(1).optional(),
  lng: z.number().min(73).max(135),
  lat: z.number().min(18).max(54),
  rank: z.union([z.literal(1), z.literal(2)]),
});

export const quoteSchema = z.object({
  text: z.string().min(1),
  work: z.string().min(1),
  status: z.enum(["verified", "pending"]).default("pending"),
});

export const choiceSchema = z.object({
  prompt: z.string().min(1),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        echo: z.string().min(1),
      }),
    )
    .min(2)
    .max(3),
});

export const lifeEventSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, "id 只能使用小写字母、数字与连字符"),
  act: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  year: z.number().int(),
  age: z.number().int().min(0).max(120),
  placeId: z
    .string()
    .regex(/^[a-z0-9-]+$/, "placeId 只能使用小写字母、数字与连字符"),
  title: z.string().min(1),
  narrative: z.string().min(40, "叙事至少 40 字").max(600, "叙事不超过 600 字"),
  quote: quoteSchema.optional(),
  choice: choiceSchema.optional(),
  refs: z.array(z.string().min(1)).min(1, "每个事件至少一条出处"),
});

export const actSchema = z.object({
  id: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  title: z.string().min(1),
  line: z.string().min(1),
});

export const figureSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  courtesy: z.string().min(1),
  dynasty: z.string().min(1),
  eraId: z.string().regex(/^[a-z0-9-]+$/),
  birth: z.number().int(),
  death: z.number().int(),
  origin: placeSchema,
  tags: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
  epilogue: z.string().min(1),
  seal: z.string().min(1).max(4),
  acts: z.array(actSchema).length(4),
  route: z.array(lifeEventSchema).min(1),
  sources: z.array(z.string().min(1)).min(1),
});

export const circleToneSchema = z.enum([
  "知己",
  "同道",
  "同僚",
  "君臣",
  "师友",
  "亲族",
  "对手",
]);

export const circleNodeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  years: z.string().min(1),
  role: z.string().min(1),
  relation: z.string().min(1).max(8),
  tone: circleToneSchema,
  depth: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  note: z.string().min(20, "交往说明至少 20 字").max(220, "交往说明不超过 220 字"),
});

export const figureCircleSchema = z.object({
  figureId: z.string().regex(/^[a-z0-9-]+$/),
  summary: z.string().min(10).max(200),
  nodes: z.array(circleNodeSchema).min(12).max(20),
  sources: z.array(z.string().min(1)).min(1),
});

export type Place = z.infer<typeof placeSchema>;
export type NamedPlace = z.infer<typeof namedPlaceSchema>;
export type AdminPlace = z.infer<typeof adminPlaceSchema>;
export type Era = z.infer<typeof eraSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type Choice = z.infer<typeof choiceSchema>;
export type LifeEvent = z.infer<typeof lifeEventSchema>;
export type Act = z.infer<typeof actSchema>;
export type Figure = z.infer<typeof figureSchema>;
export type CircleTone = z.infer<typeof circleToneSchema>;
export type CircleNode = z.infer<typeof circleNodeSchema>;
export type FigureCircle = z.infer<typeof figureCircleSchema>;
