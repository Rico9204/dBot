# Discord Activity Game

`/게임` Slash Command를 입력하면 Discord Activity를 실행하고,
Vite 기반 HTML/CSS/JS 게임 페이지를 Discord 안에서 보여주는 최소 예제입니다.

## 1. 설치

```powershell
npm install
```

## 2. 환경변수

`.env.example`을 `.env`로 복사하고 값을 입력합니다.

```env
DISCORD_CLIENT_ID=...
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
VITE_DISCORD_CLIENT_ID=...
```

`DISCORD_CLIENT_ID`와 `VITE_DISCORD_CLIENT_ID`는 같은 Discord Application ID입니다.

1대1 대전 로비에 디스코드 이름을 띄우려면 추가로:

```env
DISCORD_CLIENT_SECRET=...
```

(Developer Portal > OAuth2의 Client Secret. OAuth2 > Redirects에 `https://127.0.0.1` 하나를 넣어 두세요.
없으면 이름만 "게스트123"으로 나오고 대전은 그대로 됩니다.)

## 1대1 대전 구조

- `game-server.js`: Vite 서버에 붙는 WebSocket(`/ws`) 중계. 방 = Activity 인스턴스(같은 음성 채널에서 연 사람끼리).
- 홈 자리 = 호스트: 경기 계산을 전부 하고 상태를 초당 30번 보냄. 원정 = 입력만 보냄. 나머지 = 관전.
- `npm run dev`(또는 `build` 후 `preview`)로 띄워야 `/ws`가 동작합니다. 정적 호스팅만으로는 1대1 불가.

## 3. /게임 명령 등록

```powershell
npm run register
```

개발용으로 `DISCORD_GUILD_ID` 서버에 Guild Command를 등록합니다.

## 4. 웹 실행

```powershell
npm run dev
```

기본 주소:

```text
http://localhost:5173
```

## 5. Cloudflare Tunnel

cloudflared가 설치되어 있다면:

```powershell
cloudflared tunnel --url http://localhost:5173
```

출력되는 `https://....trycloudflare.com` 주소를 Discord Developer Portal의
Activities > URL Mappings에 연결합니다.

## 6. Discord Developer Portal

같은 Application에서:

1. Bot 생성
2. Activities 활성화
3. Activity URL Mapping 설정
4. Bot을 테스트 서버에 초대

## 7. Bot 실행

```powershell
npm run bot
```

## 8. Discord에서 실행

```text
/게임
```

Activity가 바로 실행됩니다.

## 기존 웹 게임 사용

이미 만들어 둔 웹 게임이 있다면 `index.html`, `main.js`, `style.css`를 기존 코드로 교체하세요.

Discord 연동을 유지하려면 프론트엔드에서 아래 초기화 부분은 남겨두면 됩니다.

```js
import { DiscordSDK } from "@discord/embedded-app-sdk";

const discordSdk = new DiscordSDK(
  import.meta.env.VITE_DISCORD_CLIENT_ID
);

await discordSdk.ready();
```

## 주의

- `.env`는 Git에 올리지 마세요.
- Bot Token을 `main.js`에 넣으면 안 됩니다.
- Cloudflare 임시 터널을 종료하면 Activity 주소도 사용할 수 없습니다.
