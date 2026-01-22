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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PREFIX = "!";

if (!TOKEN) {
  console.error("❌ TOKEN missing");
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY missing");
  process.exit(1);
}

// ================= OPENAI =================
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
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
  client.user.setActivity("Emergency Hamburg RP", {
    type: ActivityType.Listening
  });
});

// ================= AI FUNCTION =================
async function getAIReply(userMessage) {
  try {
    console.log("🧠 Sending to OpenAI:", userMessage);

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a chill Gen-Z AI chatbot. You help with Emergency Hamburg Roblox RP, personal life advice, and casual friendly chat. Keep replies short and natural."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    console.log("✅ OpenAI response received");

    const text = response.output_text;

    if (!text) {
      console.error("❌ Empty AI response");
      return "I didn’t get that properly, try again.";
    }

    return text;
  } catch (err) {
    console.error("❌ OPENAI ERROR:", err);
    return "AI is having issues right now, try again later.";
  }
}

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async msg => {
  if (!msg.guild || msg.author.bot) return;

  const content = msg.content.trim();

  // ---------- SET AI CHANNEL ----------
  if (content.startsWith(`${PREFIX}setaichannel`)) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return msg.reply("❌ Admin only.");

    const ch = msg.mentions.channels.first();
    if (!ch) return msg.reply("❌ Mention a channel.");

    aiChannels[msg.guild.id] = ch.id;
    return msg.reply(`✅ AI chat enabled in ${ch}`);
  }

  // ---------- AI CHAT (NORMAL MESSAGES) ----------
  if (aiChannels[msg.guild.id] === msg.channel.id) {
    msg.channel.sendTyping();

    const reply = await getAIReply(content);

    return msg.reply(reply);
  }
});

// ================= LOGIN =================
client.login(TOKEN);
