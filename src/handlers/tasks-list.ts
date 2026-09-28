import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem, requireOwner } from "../toolkit/index.js";
import { addPoints, ensureProfile, notifyOwner } from "../state.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "Tasks", data: "tasks:list" }) if the toolkit exposes it.

registerMainMenuItem({ label: "🧩 Tasks", data: "tasks:list", order: 20 });
const composer = new Composer<Ctx>();

composer.callbackQuery("tasks:list", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Choose a small task and earn points when your proof is checked.", { reply_markup: inlineKeyboard([[inlineButton("Follow the community", "task:accept:community")], [inlineButton("⬅️ Back to menu", "menu:main")]]) });
});

composer.callbackQuery("task:accept:community", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.acceptedTask = "community"; ctx.session.taskStatus = "accepted"; ctx.session.flow = "task_proof";
  await ctx.reply("You’re in! Send your proof as a short message, link, or photo caption.");
});

composer.on("message", async (ctx, next) => {
  if (ctx.session.flow !== "task_proof" || !ctx.session.acceptedTask) return next();
  const proof = ctx.message?.text ?? ctx.message?.caption;
  if (!proof) { await ctx.reply("I need a message, link, or photo caption as proof."); return; }
  ctx.session.taskProof = proof; ctx.session.taskStatus = "pending"; ctx.session.flow = undefined;
  await ctx.reply("Your proof is waiting for a quick review. I’ll let you know when it’s checked.");
  await notifyOwner(ctx, `New task proof from user ${ctx.from?.id ?? "unknown"}. Review it in the owner desk.`);
});

composer.callbackQuery("task:approve", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!(await requireOwner(ctx))) return;
  addPoints(ctx, 250); ctx.session.taskStatus = "approved";
  await ctx.reply("Task approved and 250 points were added.");
});

composer.callbackQuery("task:reject", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!(await requireOwner(ctx))) return;
  ctx.session.taskStatus = "rejected"; await ctx.reply("Task rejected. The user can submit clearer proof from Tasks.");
});

export default composer;
