import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { ensureProfile, botUsername } from "../state.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "My Profile", data: "profile:view" }) if the toolkit exposes it.

registerMainMenuItem({ label: "👤 My Profile", data: "profile:view", order: 60 });
const composer = new Composer<Ctx>();

composer.callbackQuery("profile:view", async (ctx) => {
  await ctx.answerCallbackQuery();
  ensureProfile(ctx);
  const link = `https://t.me/${botUsername(ctx)}?start=${ctx.session.referralToken}`;
  await ctx.reply(`Here’s your progress:\n\nBalance: ${ctx.session.balance} points\nEarned: ${ctx.session.earned} points\nPrizes claimed: ${ctx.session.inventory?.length ?? 0}\n\nInvite a friend and earn a bonus when they finish onboarding and their first quiz.\n${link}`, { reply_markup: inlineKeyboard([[inlineButton("🎁 Shop", "shop:browse"), inlineButton("🧩 Tasks", "tasks:list")], [inlineButton("⬅️ Back to menu", "menu:main")]]) });
});

export default composer;
