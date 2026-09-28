import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard } from "../toolkit/index.js";
import { ensureProfile, botUsername } from "../state.js";

// The /start handler renders the bot's MAIN MENU — the primary way users operate
// a button-first bot. A feature adds its own button by calling
// `registerMainMenuItem(...)` in its own `src/handlers/<slug>.ts`; this handler
// renders whatever is registered (plus a Help button), so you do NOT edit this
// file to add a feature. Send ONE message — no placeholder line above the menu.
const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  ensureProfile(ctx);
  const link = `https://t.me/${botUsername(ctx)}?start=${ctx.session.referralToken}`;
  await ctx.reply(
    `👋 Welcome to STrANNIK!\n\nYou earn 100 points for a correct quiz answer and lose 50 for a wrong one. Video rewards need #STrANNIK and 5,000 views.\n\nYour balance: ${ctx.session.balance} points\nInvite a friend: ${link}`,
    { reply_markup: mainMenuKeyboard() },
  );
});

// "Back to menu" — re-render the main menu in place from any sub-view.
composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  ensureProfile(ctx);
  await ctx.editMessageText(`👋 Welcome back! Your balance is ${ctx.session.balance} points.`, { reply_markup: mainMenuKeyboard() });
});

export default composer;
