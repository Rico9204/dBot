import "dotenv/config";
import {
  Client,
  GatewayIntentBits
} from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN이 .env에 없습니다.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`✅ Discord Bot 로그인 완료: ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "게임") {
    try {
      console.log(`${interaction.user.username}님의 Activity 실행 요청`);
      await interaction.launchActivity();
      console.log("✅ Activity 실행 요청 완료");
    } catch (error) {
      console.error("❌ Activity 실행 실패");
      console.error(error);

      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: "Activity 실행에 실패했습니다. Developer Portal의 Activities / URL Mapping 설정을 확인해주세요.",
            ephemeral: true
          });
        } catch (replyError) {
          console.error(replyError);
        }
      }
    }
  }
});

client.on("error", console.error);
client.login(TOKEN);
