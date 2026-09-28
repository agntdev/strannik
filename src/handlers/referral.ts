import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { botUsername, ensureProfile } from "../state.js";

registerMainMenuItem({ label: "💌 Invite", data: "referral:show", order: 70 });

const composer = new Composer<Ctx>();

composer.callbackQuery("referral:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  ensureProfile(ctx);
  const link = `https://t.me/${botUsername(ctx)}?start=${ctx.session.referralToken}`;
  await ctx.reply(`Invite a friend to STrANNIK:\n${link}\n\nYou’ll receive a bonus after they finish onboarding and their first quiz.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
