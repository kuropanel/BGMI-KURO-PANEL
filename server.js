require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  console.log("❌ BOT_TOKEN Missing");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const sessions = {};

const durations = [
  { id: "1h", name: "1 Hour", price: 10 },
  { id: "5h", name: "5 Hours", price: 20 },
  { id: "1d", name: "1 Day", price: 80 },
  { id: "3d", name: "3 Days", price: 150 },
  { id: "7d", name: "7 Days", price: 250 },
  { id: "30d", name: "30 Days", price: 350 },
  { id: "60d", name: "60 Days", price: 500 }
];

const bulkOptions = [1, 5, 10, 25, 50, 100, 200];

function glass(title, body) {
  return `
╭━━━━━━━━━━━━━━━━━━━━╮
      ${title}
╰━━━━━━━━━━━━━━━━━━━━╯

${body}

━━━━━━━━━━━━━━━━━━━━
✨ MIJANUR KURO AI GLASS
━━━━━━━━━━━━━━━━━━━━
`;
}

function startFlow(chatId) {
  sessions[chatId] = {
    game: "PUBG MOBILE INDIA",
    devices: 1,
    duration: null,
    customKey: "",
    bulk: 1,
    step: "game"
  };

  bot.sendMessage(chatId, glass("🎮 GAME SELECT", `
Full-page step 1/6

Selected Game:
✅ PUBG MOBILE INDIA

Click Next to continue.
`), {
    reply_markup: {
      inline_keyboard: [
        [{ text: "➡️ Next: Max Devices", callback_data: "next_devices" }]
      ]
    }
  });
}

bot.onText(/\/start/, msg => startFlow(msg.chat.id));

bot.on("callback_query", query => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (!sessions[chatId]) startFlow(chatId);
  const s = sessions[chatId];

  if (data === "next_devices") {
    s.step = "devices";
    bot.sendMessage(chatId, glass("📱 MAX DEVICES", `
Full-page step 2/6

Type max device quantity.

Example:
1
2
5
10
`));
  }

  if (data.startsWith("dur_")) {
    const id = data.replace("dur_", "");
    s.duration = durations.find(d => d.id === id);

    bot.sendMessage(chatId, glass("✅ DURATION SAVED", `
Selected Duration:
⏳ ${s.duration.name}
💰 ₹${s.duration.price}/Device

Now continue to Custom Key.
`), {
      reply_markup: {
        inline_keyboard: [
          [{ text: "➡️ Next: Custom Key", callback_data: "next_custom" }]
        ]
      }
    });
  }

  if (data === "next_custom") {
    s.step = "custom";
    bot.sendMessage(chatId, glass("🔑 CUSTOM KEY", `
Full-page step 4/6

Type your custom key.

Example:
MIJANUR-VIP-001

Or type:
skip
`));
  }

  if (data.startsWith("bulk_")) {
    s.bulk = Number(data.replace("bulk_", ""));

    const total = s.devices * s.duration.price * s.bulk;

    bot.sendMessage(chatId, glass("💰 COST ESTIMATION", `
Full-page step 6/6

🎮 Game: ${s.game}
📱 Devices: ${s.devices}
⏳ Duration: ${s.duration.name}
📦 Bulk: ${s.bulk} Key
💵 Price: ₹${s.duration.price}/Device

✅ Total Cost: ₹${total}
`), {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Generate License", callback_data: "generate" }]
        ]
      }
    });
  }

  if (data === "generate") {
    const total = s.devices * s.duration.price * s.bulk;
    let keys = [];

    for (let i = 1; i <= s.bulk; i++) {
      const key = s.customKey
        ? `${s.customKey}-${i}`
        : `KURO-PUBG-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
      keys.push(key);
    }

    bot.sendMessage(chatId, glass("✅ LICENSE GENERATED", `
🎮 Game: ${s.game}
📱 Max Devices: ${s.devices}
⏳ Duration: ${s.duration.name}
📦 Total Keys: ${s.bulk}
💰 Total Cost: ₹${total}

🔑 LICENSE KEYS:

${keys.map(k => "`" + k + "`").join("\n")}
`), { parse_mode: "Markdown" });
  }

  bot.answerCallbackQuery(query.id);
});

bot.on("message", msg => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!sessions[chatId] || text.startsWith("/")) return;

  const s = sessions[chatId];

  if (s.step === "devices") {
    const num = Number(text);
    if (!num || num < 1) {
      return bot.sendMessage(chatId, "❌ Invalid number. Example: 1");
    }

    s.devices = num;
    s.step = "duration";

    return bot.sendMessage(chatId, glass("⏳ SELECT DURATION", `
Full-page step 3/6

Select one duration:
`), {
      reply_markup: {
        inline_keyboard: durations.map(d => [
          { text: `${d.name} — ₹${d.price}/Device`, callback_data: `dur_${d.id}` }
        ])
      }
    });
  }

  if (s.step === "custom") {
    s.customKey = text.toLowerCase() === "skip" ? "" : text;
    s.step = "bulk";

    return bot.sendMessage(chatId, glass("📦 BULK GENERATION", `
Full-page step 5/6

Select total keys:
`), {
      reply_markup: {
        inline_keyboard: bulkOptions.map(n => [
          { text: `${n} Key${n > 1 ? "s" : ""}`, callback_data: `bulk_${n}` }
        ])
      }
    });
  }
});

console.log("✅ Full-page Kuro AI Glass Telegram Bot Started");
