# Jungle Campus

Jungle Campus는 교육 과정 구성원이 같은 가상 캠퍼스에 접속해 이동하고, 채팅하고, 파티를 만들고, 같은 영역 안에서 실시간 음성 대화를 시도할 수 있는 2D 커뮤니티 서비스입니다.

이 브랜치 기준의 핵심 방향은 다음과 같습니다.

- `hall`은 사용자의 소속 교육 과정을 표시하는 메타데이터로만 사용합니다.
- 실제 실시간 동기화는 `area` 기준으로 동작합니다.
- 같은 영역에 있는 사용자끼리만 파티, 채팅, 음성 연결이 이루어집니다.

## 주요 기능

- 빠른 로그인
  - 이름, 교육실, 소속 과정, 아바타 색상을 입력해 바로 입장할 수 있습니다.
- 2D 캠퍼스 이동
  - 메인 로비에서 다른 공간으로 이동하고, 각 공간 안에서 실시간으로 움직임을 공유합니다.
- 영역 기반 실시간 동기화
  - 사용자 목록, 위치, 상태, 파티, 음성 peer 탐색이 모두 현재 `area` 기준으로 맞춰집니다.
- 채팅
  - 현재 공간 전체 채팅과 근거리 채팅을 지원합니다.
- 파티 보드
  - 로비를 제외한 공간에서 파티를 만들고 참가할 수 있습니다.
- 영역 음성 대화
  - 같은 공간의 사용자끼리 WebRTC 기반 음성 연결을 시도합니다.
- 음성 디버그 패널
  - 마이크 권한, 로컬 오디오 트랙, peer 수, WebRTC 연결 상태, 원격 트랙 수신, `audio.play()` 차단 여부를 화면에서 바로 확인할 수 있습니다.

## 서비스 구조

- 프런트엔드: React + Vite
- 실시간 서버: Express + Socket.IO
- 음성: WebRTC
- 렌더링: HTML Canvas

프런트와 실시간 서버는 분리 배포를 전제로 합니다.

- 프런트엔드: Vercel
- 실시간 서버: Railway 또는 Render 같은 Node 호스팅
- TURN 서버: 필요 시 별도 `coturn`

## 사용자 흐름

1. 사용자가 로그인합니다.
2. 메인 로비에 입장합니다.
3. 포털을 통해 농구장, 강의실, 카페테리아 같은 공간으로 이동합니다.
4. 같은 공간의 사용자와 채팅하거나 파티를 만들 수 있습니다.
5. 같은 공간의 사용자와만 음성 연결을 시도합니다.

## 로컬 실행

### 요구 사항

- Node.js 22 이상 권장
- npm

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

기본 동작:

- 프런트엔드: `http://localhost:5173`
- 서버: `http://localhost:3001`

## 스크립트

- `npm run dev`: 클라이언트와 서버를 함께 실행합니다.
- `npm run build`: 프런트엔드 프로덕션 빌드를 생성합니다.
- `npm run preview`: 빌드된 프런트엔드를 미리보기로 실행합니다.

## 환경 변수

### 프런트엔드

- `VITE_SERVER_URL`
  - Socket.IO 서버 주소입니다.
- `VITE_STUN_URLS`
  - 쉼표로 구분한 STUN 서버 목록입니다.
- `VITE_TURN_URLS`
  - 쉼표로 구분한 TURN 서버 목록입니다.
- `VITE_TURN_USERNAME`
  - TURN 사용자 이름입니다.
- `VITE_TURN_CREDENTIAL`
  - TURN 비밀번호 또는 credential입니다.

예시:

```env
VITE_SERVER_URL=https://your-socket-server.example.com
VITE_STUN_URLS=stun:stun.l.google.com:19302
VITE_TURN_URLS=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

### 서버

- `PORT`
  - 서버 포트입니다.
- `CORS_ORIGIN`
  - 접속을 허용할 프런트엔드 도메인입니다.

예시:

```env
PORT=3001
CORS_ORIGIN=https://your-frontend.example.com
```

## 배포 가이드

### 프런트엔드 배포

Vercel에 배포하고 아래 환경 변수를 설정합니다.

```env
VITE_SERVER_URL=https://your-socket-server.example.com
```

음성 연결 성공률을 높이려면 TURN 정보도 함께 설정하는 것을 권장합니다.

### 서버 배포

`server/index.js`를 Node 서비스로 실행하면 됩니다.

- 시작 명령: `node server/index.js`
- CORS 설정: `CORS_ORIGIN=https://your-frontend.example.com`

이 저장소에는 Render 예시 설정으로 [render.yaml](./render.yaml)이 포함되어 있습니다.

### TURN 서버

브라우저/네트워크 환경에 따라 STUN만으로는 음성 연결이 불안정할 수 있습니다.
실제 서비스 환경에서는 별도 TURN 서버를 두는 것을 권장합니다.

`coturn`을 직접 띄우는 방법은 [docs/coturn-setup.md](./docs/coturn-setup.md)에 정리되어 있습니다.

## 프로젝트 구조

```text
src/
  components/         UI 컴포넌트
  data/               영역 데이터와 포털 정보
  features/voice/     음성 상태 패널
  lib/webrtc/         WebRTC 음성 훅
server/
  index.js            Socket.IO 기반 실시간 서버
  voice.js            음성 peer/signal 중계 로직
```

## 현재 브랜치의 포인트

- 같은 `hall`이 아니어도 같은 `area`에 있으면 서로를 볼 수 있습니다.
- 음성 peer 탐색과 동기화도 `area` 기준으로 통일되어 있습니다.
- 음성 이슈를 바로 좁혀 볼 수 있도록 디버그 상태가 UI에 노출됩니다.

## 기술 스택

- React 18
- Vite 5
- Express 4
- Socket.IO 4
- WebRTC
- HTML Canvas
