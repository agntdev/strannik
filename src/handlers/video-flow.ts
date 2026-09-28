import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem, requireOwner } from "../toolkit/index.js";
import { addPoints, notifyOwner } from "../state.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "Video for Prize", data: "video:flow" }) if the toolkit exposes it.

registerMainMenuItem({ label: "🎬 Video for Prize", data: "video:flow", order: 30 });
const composer = new Composer<Ctx>();

composer.callbackQuery("video:flow", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.flow = "video_link"; ctx.session.videoStatus = "draft";
  await ctx.reply("Share a public video with #STrANNIK and at least 5,000 views. Send the public link now.");
});

composer.on("message", async (ctx, next) => {
  if (ctx.session.flow === "video_link") {
    const link = ctx.message?.text?.trim();
    if (!link || !/^https?:\/\//i.test(link)) { await ctx.reply("That link doesn’t look public yet. Send a link starting with https://."); return; }
    ctx.session.videoLink = link; ctx.session.flow = "video_views";
    await ctx.reply("Great. How many views does it have? Send the number."); return;
  }
  if (ctx.session.flow === "video_views") {
    const views = Number(ctx.message?.text?.trim());
    if (!Number.isInteger(views) || views < 0) { await ctx.reply("Send the view count as a whole number."); return; }
    ctx.session.videoViews = views; ctx.session.flow = undefined;
    if (views < 5000) { ctx.session.videoStatus = "rejected"; await ctx.reply("You’re close, but the video needs 5,000 views before review. You can try again when it reaches the goal."); return; }
    ctx.session.videoStatus = "pending";
    await ctx.reply("Your video is ready for review. Make sure #STrANNIK is visible in the post.", { reply_markup: inlineKeyboard([[inlineButton("Submit for review", "video:submit")]]) }); return;
  }
  return next();
});

composer.callbackQuery("video:submit", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.videoStatus !== "pending" || !ctx.session.videoLink || (ctx.session.videoViews ?? 0) < 5000) { await ctx.reply("Your video needs a public link and 5,000 views before review."); return; }
  await notifyOwner(ctx, `New video submission from user ${ctx.from?.id ?? "unknown"}: ${ctx.session.videoLink} (${ctx.session.videoViews} views)`);
  await ctx.reply("Submitted! The owner will check your hashtag and views soon.");
});

composer.callbackQuery("video:approve", async (ctx) => { await ctx.answerCallbackQuery(); if (!(await requireOwner(ctx))) return; addPoints(ctx, 5000); ctx.session.videoStatus = "approved"; await ctx.reply("Video approved and 5,000 points were added."); });
composer.callbackQuery("video:reject", async (ctx) => { await ctx.answerCallbackQuery(); if (!(await requireOwner(ctx))) return; ctx.session.videoStatus = "rejected"; await ctx.reply("Video rejected. Add the required hashtag and check the view count, then submit again."); });

export default composer;
