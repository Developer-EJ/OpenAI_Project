# Jungle Campus

웹에서 동작하는 2D 교육장 커뮤니티 MVP입니다.

## 기능
- 빠른 입장형 로그인 화면
- 3개 교육 과정 중 하나 선택 후 입장
- 우드톤 2D 맵에서 캐릭터 이동
- 같은 교육장 사용자 실시간 표시
- 전체 채팅 / 근처 채팅
- 이름 / 교육실 표시

## 로컬 실행
1. `start-dev.bat` 실행
2. `Jungle Campus Server`와 `Jungle Campus Client` 창이 각각 열리는지 확인
3. 브라우저에서 `http://localhost:5173` 접속

## 프론트 배포
- Vercel 프로젝트로 배포
- Environment Variable: `VITE_SERVER_URL=https://<your-socket-server>`

## 백엔드 배포
- Render 또는 Railway 같은 Node 호스팅에 `server/index.js` 배포
- `PORT`는 호스팅 플랫폼이 주입
- `CORS_ORIGIN=https://<your-vercel-domain>` 설정
- Render를 쓸 경우 [render.yaml](./render.yaml) 사용 가능

## 기술
- React
- Vite
- Express
- Socket.IO
- HTML Canvas
