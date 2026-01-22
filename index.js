// ================= KEEP ALIVE =================
const express = require("express");
const app = express();
app.get("/", (_, res) => res.send("AI Bot Alive"));
app.listen(process.env.PORT || 3000);

// ================= ENV =================
require("dotenv").config();

// ================= IMPORTS =================
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ActivityType
} = require("discord.js");

const OpenAI = require("openai");

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PREFIX = "!";

if (!TOKEN || !OPENAI_KEY) {
  console.error("❌ Missing TOKEN or OPENAI_API_KEY");
  process.exit(1);
}

// ================= OPENAI =================
const openai = new OpenAI({ apiKey: OPENAI_KEY });

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= STORAGE =================
const aiChannels = {}; // guildId => channelId
const cooldown = new Set();

// ================= READY =================
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity("Emergency Hamburg RP AI", {
    type: ActivityType.Listening
  });
});

// ================= AI FUNCTION =================
async function getAIReply(text) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a chill Gen-Z AI for Emergency Hamburg Roblox RP. " +
          "Be friendly, short, helpful. Life advice allowed."
      },
      { role: "user", content: text }
    ]
  });

  return res.choices[0].message.content;
}

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async msg => {
  if (!msg.guild || msg.author.bot) return;

  const content = msg.content.trim();

  // ---- SET AI CHANNEL ----
  if (content.startsWith(`${PREFIX}setaichannel`)) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return msg.reply("❌ Admin only.");

    const ch = msg.mentions.channels.first();
    if (!ch) return msg.reply("❌ Mention a channel.");

    aiChannels[msg.guild.id] = ch.id;
    return msg.reply(`✅ AI chat enabled in ${ch}`);
  }

  // ---- AI CHAT ----
  if (aiChannels[msg.guild.id] !== msg.channel.id) return;
  if (cooldown.has(msg.author.id)) return;

  cooldown.add(msg.author.id);
  setTimeout(() => cooldown.delete(msg.author.id), 5000);

  try {
    await msg.channel.sendTyping();
    const reply = await getAIReply(content);
    await msg.reply(reply);
  } catch (err) {
    console.error("❌ OPENAI ERROR:", err?.response?.data || err.message);
    await msg.reply("⚠️ AI is temporarily unavailable. Try again later.");
  }
});

// ================= LOGIN =================
client.login(TOKEN);
