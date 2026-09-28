import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { PRIZES, ensureProfile, notifyOwner } from "../state.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.
// Menu: wire this into /start via registerMainMenuItem({ label: "Shop", data: "shop:browse" }) if the toolkit exposes it.

registerMainMenuItem({ label: "🎁 Shop", data: "shop:browse", order: 40 });
const composer = new Composer<Ctx>();

composer.callbackQuery("shop:browse", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showShop(ctx);
});

composer.callbackQuery(/^shop:item:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const prize = PRIZES.find((p) => p.id === ctx.match[1]); if (!prize) { await ctx.reply("That prize is no longer available."); return; } await ctx.reply(`${prize.title}\n${prize.description}\nCost: ${prize.cost} points\nAvailable: ${prize.quantity}`, { reply_markup: inlineKeyboard([[inlineButton("Redeem prize", `shop:redeem:${prize.id}`)], [inlineButton("⬅️ Back to shop", "shop:browse")]]) }); });
composer.callbackQuery(/^shop:redeem:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); ensureProfile(ctx); const prize = PRIZES.find((p) => p.id === ctx.match[1]); const balance = ctx.session.balance ?? 0; if (!prize || prize.quantity < 1) { await ctx.reply("That prize is out of stock. Try another one."); return; } if (balance < prize.cost) { await ctx.reply(`You need ${prize.cost - balance} more points for this prize.`); return; } ctx.session.balance = balance - prize.cost; ctx.session.redeemed?.push(prize.id); if (!ctx.session.inventory) ctx.session.inventory = []; ctx.session.inventory.push(prize.id); await notifyOwner(ctx, `New ${prize.physical ? "physical " : "digital "}redemption from user ${ctx.from?.id ?? "unknown"}: ${prize.title}`); await ctx.reply(prize.physical ? "Your prize is reserved. The owner will contact you about fulfillment." : "Your digital prize is ready. Thanks for playing!"); });

async function showShop(ctx: Ctx): Promise<void> { ensureProfile(ctx); await ctx.reply(PRIZES.length ? "Pick a prize and spend your points wisely." : "The shop is empty right now — check back soon.", { reply_markup: inlineKeyboard(PRIZES.map((p) => [inlineButton(`${p.title} · ${p.cost}`, `shop:item:${p.id}`)]).concat([[inlineButton("⬅️ Back to menu", "menu:main")]])) }); }

export default composer;
