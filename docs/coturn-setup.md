# WebRTC TURN Deployment

This project keeps signaling on Railway and uses a dedicated `coturn` host on EC2 for TURN relay traffic.

## Architecture

- Railway hosts the Node.js backend and Socket.IO signaling server.
- EC2 hosts `coturn` for TURN relay traffic.
- Browsers try direct P2P audio first and fall back to TURN relay when NAT traversal fails.

## Frontend env

Set these variables in the frontend deployment target such as Vercel:

```env
VITE_SERVER_URL=https://jungle-campus-production.up.railway.app
VITE_STUN_URLS=stun:stun.l.google.com:19302
VITE_TURN_URLS=turn:15.164.94.50:3478?transport=udp,turn:15.164.94.50:3478?transport=tcp
VITE_TURN_USERNAME=jungleturn
VITE_TURN_CREDENTIAL=teXrl7YDubiCPkCmi7RHc2gJm/1pp/On
```

Notes:

- `VITE_SERVER_URL` must point to the Railway backend URL that serves Socket.IO.
- `VITE_STUN_URLS` and `VITE_TURN_URLS` accept comma-separated lists.
- If the TURN host changes, update Vercel env values and redeploy the frontend.

## Backend env

Set these variables in Railway:

```env
PORT=3001
CORS_ORIGIN=https://jungle-campus.vercel.app
```

Notes:

- Railway does not need to host TURN.
- `CORS_ORIGIN` should be the deployed frontend origin.

## TURN host checklist

- TURN host: `15.164.94.50`
- TURN port: `3478`
- Protocols: UDP and TCP
- Username: `jungleturn`
- Credential: `teXrl7YDubiCPkCmi7RHc2gJm/1pp/On`

Open these inbound rules on the EC2 security group:

- `3478/TCP`
- `3478/UDP`
- `49160-49200/UDP`

## Client behavior

- The frontend reads STUN and TURN settings from env at build time.
- WebRTC now builds ICE servers from both STUN and TURN values instead of using a fixed STUN-only config.
- If TURN URLs are missing or TURN credentials are not configured, the client falls back to the available STUN configuration.

## Quick verification

1. Deploy the frontend with the env values above.
2. Deploy the backend to Railway with the correct `CORS_ORIGIN`.
3. Open two browsers on different networks if possible.
4. Join the same area and enable the microphone.
5. Confirm that audio still connects when direct P2P is unavailable, which indicates TURN relay fallback is working.
