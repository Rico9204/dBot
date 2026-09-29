import "dotenv/config";
import {
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN) throw new Error("DISCORD_BOT_TOKEN이 .env에 없습니다.");
if (!CLIENT_ID) throw new Error("DISCORD_CLIENT_ID가 .env에 없습니다.");
if (!GUILD_ID) throw new Error("DISCORD_GUILD_ID가 .env에 없습니다.");

const commands = [
  new SlashCommandBuilder()
    .setName("게임")
    .setDescription("게임 Activity를 실행합니다.")
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  try {
    console.log("Discord /게임 명령어 등록 중...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("✅ /게임 명령어 등록 완료");
  } catch (error) {
    console.error("❌ 명령어 등록 실패");
    console.error(error);
    process.exitCode = 1;
  }
}

registerCommands();
