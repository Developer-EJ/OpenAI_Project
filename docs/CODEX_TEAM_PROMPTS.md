# Codex Prompts For Each Teammate

## Common Rules For All 3 Teammates
Use this project structure and do not break ownership boundaries:
- Branch from `dev`
- Keep `main` untouched
- Do not refactor unrelated files
- Before editing shared contracts, create a small contract-first PR
- Run `npm run build` before finishing

## Prompt For Party / Group Owner
You are working only on the party and area transition system.

Goals:
- add area definitions such as lobby, basketball court, cafeteria, classroom
- move a player from lobby into an area when they enter a portal zone
- add a party recruitment dashboard inside each area

Constraints:
- do not implement voice
- do not redesign unrelated global UI
- keep changes inside `server/areas.js`, `server/party.js`, `src/features/party`, `src/features/areas`

## Prompt For Voice Owner
You are working only on the voice system.

Goals:
- users in the same room can hear each other
- room membership comes from the existing server room state
- keep voice transport and UI state isolated

Constraints:
- do not change map movement rules
- do not change party dashboard behavior
- keep changes inside `server/voice.js`, `src/features/voice`, `src/lib/webrtc`

## Prompt For Map / UI Owner
You are working only on maps and UI.

Goals:
- build the main lobby map
- build area maps and portal visuals
- show area entry feedback and dashboard shell UI

Constraints:
- do not implement business logic for party matching
- do not implement audio transport
- keep changes inside `src/features/map`, `src/features/ui`, `src/data/areas.js`
