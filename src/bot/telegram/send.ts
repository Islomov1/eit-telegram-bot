type ReplyMarkup = {
  inline_keyboard: {
    text: string;
    callback_data: string;
  }[][];
};

const TELEGRAM_API = "https://api.telegram.org";

/**
 * Send message to Telegram
 */
export async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  replyMarkup?: ReplyMarkup
): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/**
 * Acknowledge callback queries (prevents loading spinner)
 */
export async function answerCallback(
  token: string,
  callbackQueryId: string
): Promise<void> {
  await fetch(`${TELEGRAM_API}/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
    }),
  });
}
