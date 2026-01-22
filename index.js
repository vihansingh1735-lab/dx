// ================= KEEP ALIVE (RENDER) =================
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

if (!TOKEN) {
  console.error("❌ TOKEN missing");
  process.exit(1);
}
if (!OPENAI_KEY) {
  console.error("❌ OPENAI_API_KEY missing");
  process.exit(1);
}

// ================= OPENAI =================
const openai = new OpenAI({
  apiKey: OPENAI_KEY
});

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

// ================= READY =================
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity("Emergency Hamburg RP AI", {
    type: ActivityType.Listening
  });
});

// ================= AI FUNCTION =================
async function getAIReply(userMessage) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly Gen-Z AI chatbot for Emergency Hamburg Roblox RP. " +
            "You also help with chill conversations and basic life advice. " +
            "Keep replies short, friendly, and human-like."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    return res.choices[0]?.message?.content || "Hmm… I didn’t get that 😅";
  } catch (err) {
    console.error("❌ OpenAI Error:", err);
    return "⚠️ AI is having issues right now. Try again in a bit.";
  }
}

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async msg => {
  if (!msg.guild || msg.author.bot) return;

  const content = msg.content.trim();

  // -------- SET AI CHANNEL --------
  if (content.startsWith(`${PREFIX}setaichannel`)) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return msg.reply("❌ Admin only.");

    const ch = msg.mentions.channels.first();
    if (!ch) return msg.reply("❌ Mention a channel.");

    aiChannels[msg.guild.id] = ch.id;
    return msg.reply(`✅ AI will now reply in ${ch}`);
  }

  // -------- AI AUTO CHAT --------
  if (aiChannels[msg.guild.id] === msg.channel.id) {
    await msg.channel.sendTyping();

    const reply = await getAIReply(content);

    // NORMAL TEXT REPLY (NO EMBED)
    return msg.reply(reply);
  }
});

// ================= LOGIN =================
client.login(TOKEN);
