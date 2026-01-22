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
  console.log(`🤖 AI logged in as ${client.user.tag}`);
  client.user.setActivity("Emergency Hamburg RP", {
    type: ActivityType.Listening
  });
});

// ================= AI FUNCTION (FIXED) =================
async function getAIReply(userMessage) {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a chill Gen-Z AI chatbot. You help with Emergency Hamburg Roblox RP, casual life advice, and friendly conversations. Keep replies short, natural, and human."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    return response.output_text;
  } catch (err) {
    console.error("❌ OpenAI Error:", err.message);
    return "🤖 I’m having a small brain lag 😭 try again in a sec.";
  }
}

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async msg => {
  if (!msg.guild || msg.author.bot) return;

  const content = msg.content;

  // -------- SET AI CHANNEL --------
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
          .setTitle("✅ AI Channel Configured")
          .setDescription(`AI will now reply in ${ch}`)
      ]
    });
  }

  // -------- AI AUTO CHAT --------
  if (aiChannels[msg.guild.id] === msg.channel.id) {
    if (content.length < 2) return;

    await msg.channel.sendTyping();

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
          .setFooter({ text: "Emergency Hamburg RP AI" })
      ]
    });
  }
});

// ================= LOGIN =================
client.login(TOKEN);
