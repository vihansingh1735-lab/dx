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
  EmbedBuilder,
  ActivityType
} = require("discord.js");

const OpenAI = require("openai");

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PREFIX = "!";

// ================= AI SETUP =================
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

// ================= STORAGE (MEMORY) =================
const aiChannels = {}; // guildId => channelId

// ================= READY =================
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity("AI Support", { type: ActivityType.Listening });
});

// ================= AI FUNCTION =================
async function getAIReply(message) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a calm, friendly Gen-Z AI assistant. You help with Roblox Emergency Hamburg RP, life advice, and general chill conversations. If a question is unsafe or unclear, politely refuse."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.error("AI Error:", err.message);
    return "I can’t reply regarding this right now. Please wait for staff assistance.";
  }
}

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async msg => {
  if (!msg.guild || msg.author.bot) return;

  const content = msg.content;

  // -------- SET AI CHANNEL (ADMIN) --------
  if (content.startsWith(`${PREFIX}setaichannel`)) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return msg.reply("❌ Admin only.");

    const ch = msg.mentions.channels.first();
    if (!ch) return msg.reply("❌ Mention a channel.");

    aiChannels[msg.guild.id] = ch.id;

    return msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ AI Channel Set")
          .setDescription(`AI will now reply in ${ch}`)
      ]
    });
  }

  // -------- AI AUTO REPLY --------
  if (aiChannels[msg.guild.id] === msg.channel.id) {
    msg.channel.sendTyping();

    const reply = await getAIReply(content);

    return msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setAuthor({
            name: "AI Assistant",
            iconURL: client.user.displayAvatarURL()
          })
          .setDescription(reply)
      ]
    });
  }
});

// ================= LOGIN =================
client.login(TOKEN);
