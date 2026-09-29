import { DiscordSDK } from "@discord/embedded-app-sdk";
import "@fontsource/jua";
import "@fontsource/do-hyeon";
import "@fontsource/chakra-petch/600.css";
import "@fontsource/chakra-petch/700.css";

const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;

// 내 이름과 방(= Activity 인스턴스)을 알아냅니다. 1대1 대전 로비에서 사용.
// Discord 밖(localhost 브라우저)에서는 frame_id가 없어 SDK가 에러를 던지므로 'local' 방의 게스트로 들어갑니다.
async function setupDiscord() {
  const guest = { name: `게스트${Math.floor(100 + Math.random() * 900)}`, room: "local" };
  if (!new URLSearchParams(location.search).has("frame_id")) return guest;

  const discordSdk = new DiscordSDK(CLIENT_ID);
  await discordSdk.ready();
  console.log("Discord SDK Ready");
  const room = discordSdk.instanceId;
  try {
    const { code } = await discordSdk.commands.authorize({
      client_id: CLIENT_ID,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify"],
    });
    const res = await fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const { access_token } = await res.json();
    const { user } = await discordSdk.commands.authenticate({ access_token });
    return { name: user.global_name || user.username, room };
  } catch (error) {
    // 인증이 안 돼도 게임은 됩니다 (이름만 게스트로)
    console.error("Discord 인증 실패:", error);
    return { ...guest, room };
  }
}

window.discordUser = setupDiscord().catch((error) => {
  console.error("Discord SDK 연결 실패:", error);
  return { name: `게스트${Math.floor(100 + Math.random() * 900)}`, room: "local" };
});
window.discordUser.then(({ name }) => {
  document.getElementById("menuName").textContent = `👋 ${name} 님, 모드를 고르세요`;
});
