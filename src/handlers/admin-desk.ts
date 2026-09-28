import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem, requireOwner } from "../toolkit/index.js";
import { addPoints } from "../state.js";

registerMainMenuItem({ label: "🛠 Owner desk", data: "admin:desk", order: 1000 });

const composer = new Composer<Ctx>();

composer.callbackQuery("admin:desk", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!(await requireOwner(ctx))) return;
  const pending = ctx.session.videoStatus === "pending" || ctx.session.taskStatus === "pending";
  await ctx.reply(pending ? "There’s a submission waiting for you." : "Your review queue is clear.", {
    reply_markup: inlineKeyboard([
      [inlineButton("Approve video", "video:approve"), inlineButton("Reject video", "video:reject")],
      [inlineButton("Approve task", "task:approve"), inlineButton("Reject task", "task:reject")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^admin:add:(-?\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!(await requireOwner(ctx))) return;
  const delta = Number(ctx.match[1]);
  addPoints(ctx, delta);
  await ctx.reply(`${delta >= 0 ? "Added" : "Removed"} ${Math.abs(delta)} points. The balance is now ${ctx.session.balance ?? 0} points.`);
});

export default composer;
