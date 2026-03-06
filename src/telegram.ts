import https from 'https';

export async function sendTelegramNotification(name: string, phone: string, message?: string): Promise<boolean> {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('[telegram] BOT_TOKEN or CHAT_ID missing');
    return false;
  }

  const text = [
    `Новая заявка!`,
    `Имя: ${name}`,
    `Тел: ${phone}`,
    message ? `Сообщение: ${message}` : '',
  ].filter(Boolean).join('\n');

  const data = JSON.stringify({ chat_id: CHAT_ID, text });

  return new Promise((resolve) => {
    const req = https.request(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => resolve(res.statusCode === 200),
    );
    req.on('error', () => resolve(false));
    req.write(data);
    req.end();
  });
}
