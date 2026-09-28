import "server-only";

const BOT_TOKEN = process.env.TELEGRAM_MANAGER_BOT_TOKEN;

export async function sendManagerMessage(chatId: string, text: string): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) console.error("Telegram manager sendMessage error:", await res.text());
  } catch (err) {
    console.error("Telegram manager sendMessage failed:", err);
  }
}
