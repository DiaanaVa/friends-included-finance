import "server-only";
import { getTelegramEnv } from "./env";

export type TelegramMessage = { message_id: number; chat: { id: number }; from?: { id: number; username?: string }; text?: string };
export type TelegramUpdate = { update_id: number; message?: TelegramMessage };

export async function sendTelegramMessage(chatId: number, text: string) {
  const { TELEGRAM_BOT_TOKEN } = getTelegramEnv();
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }), cache: "no-store",
  });
  if (!response.ok) throw new Error(`Telegram delivery failed (${response.status}).`);
  return response.json();
}

export async function setTelegramWebhook(url: string) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET } = getTelegramEnv();
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, secret_token: TELEGRAM_WEBHOOK_SECRET, allowed_updates: ["message"] }),
  });
  if (!response.ok) throw new Error(`Telegram webhook registration failed (${response.status}).`);
  return response.json();
}
