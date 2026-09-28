import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "Leaderboard", data: "leaderboard:view" }) if the toolkit exposes it.

registerMainMenuItem({ label: "🏆 Leaderboard", data: "leaderboard:view", order: 50 });
const composer = new Composer<Ctx>();

composer.callbackQuery("leaderboard:view", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("See how you’re doing and choose a time window.", { reply_markup: inlineKeyboard([[inlineButton("Today", "leaderboard:day"), inlineButton("This week", "leaderboard:week")], [inlineButton("This month", "leaderboard:month"), inlineButton("All time", "leaderboard:all")]]) });
});

composer.callbackQuery(/^leaderboard:(day|week|month|all)$/, async (ctx) => { await ctx.answerCallbackQuery(); const label = ({ day: "today", week: "this week", month: "this month", all: "all time" } as const)[ctx.match[1] as "day" | "week" | "month" | "all"]; await ctx.reply(`The ${label} leaderboard is warming up. You’re currently building your score — keep playing to claim a place!`); });

export default composer;
