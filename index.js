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

// ================= MEMORY STORAGE =================
const aiChannels = {}; // guildId => channelId

// ================= READY =================
client.once("ready", () => {
  console.log(`🤖 AI logged in as ${client.user.tag}`);
  client.user.setActivity("Emergency Hamburg RP", {
    type: ActivityType.Listening
  });
});

// ================= AI FUNCTION =================
async function getAIReply(userMessage) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly Gen-Z AI assistant for a Roblox Emergency Hamburg RP community. " +
            "You help with RP rules, police/fire/EMS guidance, chill conversations, and light personal advice. " +
            "If a message is meaningless, too short, or unclear, politely ask for clarification. " +
            "Never act as staff. Never moderate."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("AI Error:", err.message);
    return "🤖 I can’t reply to that right now. Please try again in a moment.";
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

    return msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ AI Channel Configured")
          .setDescription(`AI will now reply in ${ch}`)
      ]
    });
  }

  // -------- AI AUTO REPLY --------
  if (aiChannels[msg.guild.id] !== msg.channel.id) return;

  // Ignore commands & junk
  if (content.startsWith(PREFIX)) return;
  if (content.length < 3) return;

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
});

// ================= LOGIN =================
client.login(TOKEN);
