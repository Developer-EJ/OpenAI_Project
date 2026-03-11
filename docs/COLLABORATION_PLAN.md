# Jungle Campus Collaboration Plan

## Branch Strategy
- Keep `main` protected and deployable.
- Create a shared integration branch from `main` named `dev`.
- Each teammate branches from `dev`, not from `main`.
- Merge order: feature branch -> `dev` -> test on `dev` -> merge `dev` into `main`.

## Suggested Branches
- `feature/party-area-system`
- `feature/voice-room-system`
- `feature/map-ui-system`

## Ownership
### 1. Party / Group System
- Owner: teammate A
- Scope:
  - area entry / exit flow
  - party recruiting dashboard
  - room transition logic from lobby to area
- Primary files:
  - `server/areas.js`
  - `server/party.js`
  - `src/features/party/*`
  - `src/features/areas/*`

### 2. Voice System
- Owner: teammate B
- Scope:
  - same-room voice connection
  - room membership based audio routing
  - voice state UI hooks only when needed
- Primary files:
  - `server/voice.js`
  - `src/features/voice/*`
  - `src/lib/webrtc/*`

### 3. Map / UI System
- Owner: teammate C
- Scope:
  - lobby map
  - area maps
  - movement triggers near portals
  - dashboard layout and visual UI
- Primary files:
  - `src/features/map/*`
  - `src/features/ui/*`
  - `src/data/areas.js`

## Shared Contract Rules
- Do not edit another teammate's feature folder unless discussed first.
- Shared contracts must be changed in small PRs first.
- Shared contracts:
  - socket event names
  - player / room / party payload shapes
  - area config schema
- Put shared constants in one place before feature work spreads.

## Recommended Directory Split
```text
src/
  features/
    areas/
    map/
    party/
    ui/
    voice/
  data/
    areas.js
  lib/
    socket/
    webrtc/
server/
  areas.js
  party.js
  voice.js
  room-state.js
```

## Merge Rules
- PR size target: under 300 lines when possible.
- Rebase or merge `dev` into feature branches every day.
- Never open PRs directly into `main` except from `dev`.
- If two people must touch the same file, split the shared refactor first.

## Work Order
1. Create shared folder structure and contracts first.
2. Build area config and room transition flow.
3. Build map portal UI on top of the shared area config.
4. Add party dashboard using the same room model.
5. Add voice using room membership from the server.

## Definition Of Done
- Feature works locally with 2 browser windows.
- No direct `main` merge.
- `npm run build` passes before merge to `dev`.
- README or docs updated if shared contracts changed.
