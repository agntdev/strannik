import type { Ctx } from "./bot.js";

export const CATEGORIES = [
  "Cars", "Nature", "Geography", "Animals", "Sports", "Games",
  "Films", "Technology", "Logic", "History", "Space", "Food",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Question {
  text: string;
  choices: string[];
  answer: number;
  explanation: string;
}

export const QUESTIONS: Record<Category, Question[]> = {
  Cars: [{ text: "Which part helps a car slow down?", choices: ["Brakes", "Spoiler", "Radio"], answer: 0, explanation: "Brakes turn motion into heat and slow the car." }],
  Nature: [{ text: "What do plants use to make food from sunlight?", choices: ["Photosynthesis", "Hibernation", "Migration"], answer: 0, explanation: "Photosynthesis uses light to make food." }],
  Geography: [{ text: "Which is the largest ocean?", choices: ["Atlantic", "Pacific", "Arctic"], answer: 1, explanation: "The Pacific Ocean is the largest." }],
  Animals: [{ text: "What is a baby frog called?", choices: ["Tadpole", "Calf", "Cub"], answer: 0, explanation: "A young frog begins life as a tadpole." }],
  Sports: [{ text: "How many players start on one soccer team?", choices: ["9", "11", "13"], answer: 1, explanation: "A soccer team starts with eleven players." }],
  Games: [{ text: "In chess, which piece moves in an L shape?", choices: ["Bishop", "Knight", "Rook"], answer: 1, explanation: "The knight makes an L-shaped move." }],
  Films: [{ text: "What do we call the written plan for a film?", choices: ["Script", "Scoreboard", "Atlas"], answer: 0, explanation: "A script describes the film's dialogue and action." }],
  Technology: [{ text: "What does URL identify?", choices: ["A web address", "A battery", "A keyboard"], answer: 0, explanation: "A URL is the address of a resource on the web." }],
  Logic: [{ text: "If all roses are flowers, what must be true?", choices: ["Every rose is a flower", "Every flower is a rose", "No roses exist"], answer: 0, explanation: "That is exactly what the first statement says." }],
  History: [{ text: "Which ancient people built the pyramids at Giza?", choices: ["Egyptians", "Vikings", "Aztecs"], answer: 0, explanation: "The pyramids at Giza were built in ancient Egypt." }],
  Space: [{ text: "Which star is closest to Earth?", choices: ["Sirius", "The Sun", "Polaris"], answer: 1, explanation: "The Sun is Earth's nearest star." }],
  Food: [{ text: "What is the main ingredient in traditional hummus?", choices: ["Chickpeas", "Apples", "Rice"], answer: 0, explanation: "Hummus is traditionally made from chickpeas." }],
};

export interface Prize { id: string; title: string; description: string; cost: number; quantity: number; physical: boolean; }
export const PRIZES: Prize[] = [
  { id: "sticker", title: "STrANNIK sticker pack", description: "A cheerful digital sticker pack.", cost: 300, quantity: 100, physical: false },
  { id: "mug", title: "STrANNIK mug", description: "A community mug, fulfilled by the owner.", cost: 2500, quantity: 10, physical: true },
];

export function ensureProfile(ctx: Ctx): void {
  if (ctx.session.balance === undefined) ctx.session.balance = 0;
  if (ctx.session.earned === undefined) ctx.session.earned = 0;
  if (!ctx.session.inventory) ctx.session.inventory = [];
  if (!ctx.session.redeemed) ctx.session.redeemed = [];
  if (!ctx.session.referralToken) ctx.session.referralToken = `invite-${ctx.from?.id ?? ctx.chat?.id ?? "friend"}`;
}

export function addPoints(ctx: Ctx, points: number): number {
  ensureProfile(ctx);
  const before = ctx.session.balance ?? 0;
  const after = Math.max(0, before + points);
  ctx.session.balance = after;
  if (points > 0) ctx.session.earned = (ctx.session.earned ?? 0) + points;
  return after;
}

export function botUsername(ctx: Ctx): string {
  return ctx.me?.username ?? "STrANNIK_bot";
}

export async function notifyOwner(ctx: Ctx, text: string): Promise<void> {
  const owner = (ctx as Ctx & { env?: Record<string, unknown> }).env?.ADMIN_CHAT_ID ??
    (typeof process !== "undefined" ? process.env.ADMIN_CHAT_ID : undefined);
  if (owner === undefined || owner === "") return;
  try { await ctx.api.sendMessage(String(owner), text); } catch { /* owner may be unavailable */ }
}
