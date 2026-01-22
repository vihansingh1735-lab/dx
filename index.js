// ===================== ENV =====================
require("dotenv").config();

// ===================== KEEP ALIVE (RENDER) =====================
const express = require("express");
const app = express();
app.get("/", (_, res) => res.send("AI Bot Alive"));
app.listen(process.env.PORT || 3000);

// ===================== IMPORTS =====================
const {
  Client,
  GatewayIntentBits,
  ActivityType
} = require("discord.js");

const OpenAI = require("openai");

// ===================== CONFIG =====================
const TOKEN = process.env.TOKEN;
const PREFIX = "!";

// ===================== OPENAI =====================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===================== CLIENT =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===================== AI BRAIN =====================
const SYSTEM_PROMPT = `
You are an AI assistant for the Roblox Emergency Hamburg community.

Personality:
- Calm, friendly, Gen-Z chill (not cringe)
- Respectful and supportive
- Short clear replies unless user asks for detail

Responsibilities:
1. Help with Emergency Hamburg Roblox:
   - RP guidance
   - Emergency procedures (roleplay only)
   - Rank & test help
2. Answer server-related questions
3. Give chill personal-life advice (non-medical)
4. Refuse unsafe / rule-breaking requests politely

Rules:
- Never help break Roblox or Discord rules
- Never give real-life emergency instructions
- If unsure, say you can’t help but offer a related safe topic

Tone examples:
- "Got you."
- "That’s valid honestly."
- "Let’s break it down real quick."
`;

// ===================== AI FUNCTION =====================
async function getAIReply(message) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message }
    ]
  });

  return completion.choices[0].message.content;
}

// ===================== READY =====================
client.once("ready", () => {
  console.log(`🤖 AI Online as ${client.user.tag}`);
  client.user.setActivity("Emergency Hamburg RP", {
    type: ActivityType.Listening
  });
});

// ===================== MESSAGE HANDLER =====================
client.on("messageCreate", async msg => {
  if (msg.author.bot || !msg.guild) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const [cmd, ...args] = msg.content.slice(1).trim().split(/ +/);

  // ===================== AI COMMAND =====================
  if (cmd === "ai") {
    const question = args.join(" ");
    if (!question)
      return msg.reply("Ask something after `!ai`");

    try {
      await msg.channel.sendTyping();
      const reply = await getAIReply(question);
      return msg.reply(reply);
    } catch (err) {
      console.error(err);
      return msg.reply("I couldn't reply right now. Try again later.");
    }
  }

  // ===================== HELP =====================
  if (cmd === "help") {
    return msg.reply(
      "**🧠 AI Commands**\n" +
      "`!ai <message>` → Talk to AI\n\n" +
      "**Examples:**\n" +
      "`!ai how to pass moderation test`\n" +
      "`!ai life feels stressful`\n" +
      "`!ai police rp procedure`"
    );
  }
});

// ===================== LOGIN =====================
client.login(TOKEN);
