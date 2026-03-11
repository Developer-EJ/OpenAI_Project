# Jungle Campus

Jungle Campus는 교육 과정 구성원이 같은 가상 캠퍼스에 접속해 이동하고, 채팅하고, 파티를 만들고, 같은 영역 안에서 실시간 음성 대화를 시도할 수 있는 2D 커뮤니티 서비스입니다.

이 브랜치의 핵심 설계는 다음과 같습니다.

- `hall`은 사용자의 소속 교육 과정을 표시하는 메타데이터로만 사용합니다.
- 실제 실시간 동기화 기준은 `hall`이 아니라 `area`입니다.
- 같은 `area`에 있는 사용자끼리만 위치, 채팅, 파티, 음성 연결이 맞물립니다.

## 주요 기능

- 빠른 로그인과 프로필 설정
- 메인 로비 및 영역 이동
- 영역 기반 실시간 위치 동기화
- 전체 채팅 / 근거리 채팅
- 영역별 파티 생성 및 참여
- WebRTC 기반 영역 음성 대화
- 음성 연결 상태를 바로 확인할 수 있는 디버그 패널

## 서비스 구성

- 프런트엔드: Vercel에 배포되는 React SPA
- 백엔드: Railway에 배포되는 Node.js + Socket.IO 서버
- 음성 연결: WebRTC
- TURN: 필요 시 별도 `coturn` 서버 연결

현재 코드 기본 설정에서도 원격 소켓 서버는 Railway 주소를 기준으로 사용합니다.

## 사용자 흐름

1. 사용자가 이름, 교육실, 소속 과정을 입력하고 입장합니다.
2. 메인 로비에 진입한 뒤 원하는 공간으로 이동합니다.
3. 같은 공간의 사용자와 채팅하거나 파티를 만들 수 있습니다.
4. 같은 공간의 사용자와만 음성 연결을 시도합니다.
5. 음성 패널에서 권한, 연결 상태, 재생 차단 여부를 확인할 수 있습니다.

## 환경 변수

### 프런트엔드

- `VITE_SERVER_URL`
  - Socket.IO 서버 주소
- `VITE_STUN_URLS`
  - 쉼표로 구분한 STUN 서버 목록
- `VITE_TURN_URLS`
  - 쉼표로 구분한 TURN 서버 목록
- `VITE_TURN_USERNAME`
  - TURN 사용자 이름
- `VITE_TURN_CREDENTIAL`
  - TURN 비밀번호 또는 credential

예시:

```env
VITE_SERVER_URL=https://your-socket-server.example.com
VITE_STUN_URLS=stun:stun.l.google.com:19302
VITE_TURN_URLS=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

### 백엔드

- `PORT`
  - 서버 포트
- `CORS_ORIGIN`
  - 접속을 허용할 프런트엔드 도메인

예시:

```env
PORT=3001
CORS_ORIGIN=https://your-frontend.example.com
```

## 배포 기준

### 프런트엔드

- 배포 플랫폼: Vercel
- 핵심 설정: `VITE_SERVER_URL`

### 백엔드

- 배포 플랫폼: Railway
- 시작 명령: `node server/index.js`
- 핵심 설정: `CORS_ORIGIN`

### TURN 서버

브라우저나 네트워크 환경에 따라 STUN만으로는 음성 연결이 불안정할 수 있습니다.
실제 서비스 환경에서는 별도 TURN 서버 사용을 권장합니다.

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
  voice.js            음성 peer / signal 중계 로직
```

## 이 브랜치의 포인트

- 같은 `hall`이 아니어도 같은 `area`에 있으면 서로를 볼 수 있습니다.
- 음성 peer 탐색과 동기화도 `area` 기준으로 통일되어 있습니다.
- 음성 이슈를 바로 좁혀 볼 수 있도록 디버그 상태가 UI에 노출됩니다.

## 기술 스택

### 프런트엔드

- React 18
- Vite 5
- HTML Canvas

역할:
- 사용자 인터페이스 렌더링
- 캠퍼스 화면 및 아바타 표시
- 브라우저 측 상태 관리와 소켓 연결

### 백엔드 / 실시간 서버

- Node.js
- Express 4
- Socket.IO 4

역할:
- 사용자 접속 관리
- 영역 이동, 채팅, 파티 상태 동기화
- 음성 시그널링 중계

### 실시간 음성

- WebRTC
- STUN / TURN

역할:
- 같은 영역 사용자 간 P2P 음성 연결 시도
- ICE 후보 교환
- 원격 오디오 스트림 수신

### 배포 / 운영

- Vercel
- Railway
- GitHub

역할:
- 프런트엔드 배포
- 백엔드 서비스 호스팅
- 브랜치 기반 배포 및 버전 관리

### 선택 인프라

- coturn

역할:
- 직접 연결이 어려운 네트워크 환경에서 TURN 릴레이 제공
