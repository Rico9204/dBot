// 1대1 대전용 중계 서버 (Vite 개발/미리보기 서버에 붙어서 같은 주소·같은 터널로 동작)
// 방 = Discord Activity 인스턴스. 홈 자리 = 호스트(게임 계산 담당), 원정 자리 = 상대, 나머지 = 관전.
import { WebSocketServer } from "ws";

const rooms = new Map(); // room -> { clients:Set, home, away, playing }
let nextId = 1;

const who = (ws) => ws && { id: ws.meta.id, name: ws.meta.name, hands: ws.meta.hands };

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
}

function broadcastLobby(room) {
  const msg = JSON.stringify({
    t: "lobby",
    players: [...room.clients].map(who),
    home: who(room.home),
    away: who(room.away),
    playing: room.playing,
  });
  room.clients.forEach((c) => send(c, msg));
}

function onConnect(ws, req) {
  const q = new URL(req.url, "http://x").searchParams;
  const key = q.get("room") || "local";
  if (!rooms.has(key)) rooms.set(key, { clients: new Set(), home: null, away: null, playing: false });
  const room = rooms.get(key);
  ws.meta = { id: nextId++, name: (q.get("name") || "플레이어").slice(0, 24), hands: { throw: "R", bat: "R" } };
  room.clients.add(ws);
  send(ws, { t: "hello", id: ws.meta.id });
  broadcastLobby(room);

  ws.on("message", (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    const seated = ws === room.home || ws === room.away;
    switch (m.t) {
      case "hands":
        if (m.hands) ws.meta.hands = { throw: m.hands.throw === "L" ? "L" : "R", bat: m.hands.bat === "L" ? "L" : "R" };
        broadcastLobby(room);
        break;
      case "sit": // seat: "home" | "away" | null(일어나기)
        if (room.playing) return;
        if (room.home === ws) room.home = null;
        if (room.away === ws) room.away = null;
        if ((m.seat === "home" || m.seat === "away") && !room[m.seat]) room[m.seat] = ws;
        broadcastLobby(room);
        break;
      case "start":
        if (!room.playing && seated && room.home && room.away) {
          room.playing = true;
          broadcastLobby(room);
        }
        break;
      case "end":
        if (room.playing && seated) {
          room.playing = false;
          broadcastLobby(room);
        }
        break;
      case "input": // 원정 → 홈(호스트)
        if (room.playing && ws === room.away && room.home) send(room.home, raw.toString());
        break;
      case "state": // 홈(호스트) → 나머지 모두
        if (room.playing && ws === room.home) {
          const s = raw.toString();
          room.clients.forEach((c) => c !== ws && send(c, s));
        }
        break;
    }
  });

  ws.on("close", () => {
    room.clients.delete(ws);
    const wasSeated = ws === room.home || ws === room.away;
    if (room.home === ws) room.home = null;
    if (room.away === ws) room.away = null;
    if (wasSeated && room.playing) {
      room.playing = false;
      room.clients.forEach((c) => send(c, { t: "abort", name: ws.meta.name }));
    }
    if (room.clients.size) broadcastLobby(room);
    else rooms.delete(key);
  });
}

// Discord OAuth: Activity가 받은 code를 access_token으로 바꿔 줍니다 (Client Secret은 서버에만).
async function tokenHandler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; return res.end(); }
  let body = "";
  for await (const chunk of req) body += chunk;
  try {
    const { code } = JSON.parse(body);
    const r = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
      }),
    });
    const data = await r.json();
    const { access_token } = data;
    if (!access_token) {
      console.error("토큰 교환 실패:", data, process.env.DISCORD_CLIENT_SECRET ? "" : "(.env에 DISCORD_CLIENT_SECRET 없음)");
      res.statusCode = 500;
      return res.end();
    }
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ access_token }));
  } catch (e) {
    console.error("토큰 교환 실패:", e);
    res.statusCode = 500;
    res.end();
  }
}

function attach(server) {
  const wss = new WebSocketServer({ noServer: true });
  server.httpServer?.on("upgrade", (req, socket, head) => {
    // Vite HMR 소켓은 그대로 두고 /ws 만 처리
    if (new URL(req.url, "http://x").pathname !== "/ws") return;
    wss.handleUpgrade(req, socket, head, (ws) => onConnect(ws, req));
  });
  server.middlewares.use("/api/token", tokenHandler);
}

export default function gameServer() {
  return { name: "game-server", configureServer: attach, configurePreviewServer: attach };
}
