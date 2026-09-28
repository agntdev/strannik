import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { CATEGORIES, QUESTIONS, addPoints, ensureProfile, type Category } from "../state.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "Play Quiz", data: "quiz:start" }) if the toolkit exposes it.

registerMainMenuItem({ label: "🎯 Play Quiz", data: "quiz:start", order: 10 });
const composer = new Composer<Ctx>();

composer.callbackQuery("quiz:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Pick a topic and let’s see what you know.", { reply_markup: inlineKeyboard(CATEGORIES.map((name, i) => [inlineButton(name, `quiz:cat:${i}`)])) });
});

composer.callbackQuery(/^quiz:cat:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const category = CATEGORIES[Number(ctx.match[1])];
  if (!category) { await ctx.reply("That topic isn't available. Tap Play Quiz to try again."); return; }
  ctx.session.flow = "quiz"; ctx.session.quizCategory = category; ctx.session.quizIndex = 0; ctx.session.quizScore = 0; ctx.session.quizCorrect = 0;
  await sendQuestion(ctx, category);
});

composer.callbackQuery(/^quiz:answer:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.flow !== "quiz" || !ctx.session.quizCategory) { await ctx.reply("That quiz has ended. Tap Play Quiz to start a new one."); return; }
  const category = ctx.session.quizCategory as Category;
  const question = QUESTIONS[category]?.[ctx.session.quizIndex ?? 0];
  if (!question) { await finish(ctx); return; }
  const answer = Number(ctx.match[1]);
  const correct = answer === question.answer;
  const points = correct ? 100 : -50;
  addPoints(ctx, points);
  ctx.session.quizScore = (ctx.session.quizScore ?? 0) + points;
  if (correct) ctx.session.quizCorrect = (ctx.session.quizCorrect ?? 0) + 1;
  ctx.session.quizIndex = (ctx.session.quizIndex ?? 0) + 1;
  if ((ctx.session.quizIndex ?? 0) >= QUESTIONS[category].length) await finish(ctx);
  else await sendQuestion(ctx, category);
});

async function sendQuestion(ctx: Ctx, category: Category): Promise<void> {
  const question = QUESTIONS[category][ctx.session.quizIndex ?? 0];
  await ctx.reply(`${category}: ${question.text}`, { reply_markup: inlineKeyboard(question.choices.map((choice, i) => [inlineButton(choice, `quiz:answer:${i}`)])) });
}

async function finish(ctx: Ctx): Promise<void> {
  const earned = ctx.session.quizScore ?? 0;
  ctx.session.flow = undefined; ctx.session.quizCompleted = true;
  await ctx.reply(`Nice work! You scored ${ctx.session.quizCorrect ?? 0} correct and ${earned >= 0 ? "earned" : "lost"} ${Math.abs(earned)} points. Your balance is ${ctx.session.balance ?? 0} points.`);
}

export default composer;
