import { AREA_ORDER, AREA_META, DEFAULT_AREA_ID, PARTY_ENABLED_AREAS } from "../constants";

function formatPartyCount(parties) {
  if (!parties.length) {
    return "등록된 파티가 아직 없어요.";
  }

  return `${parties.length}개의 파티가 모집 중입니다.`;
}

export default function PartyPanel({
  currentArea,
  parties,
  selfId,
  createForm,
  onCreateFormChange,
  onCreateParty,
  onJoinParty,
  onAreaChange,
  partyMessage
}) {
  const areaMeta = AREA_META[currentArea] || AREA_META[DEFAULT_AREA_ID];
  const canCreateParty = PARTY_ENABLED_AREAS.includes(currentArea);

  return (
    <aside className="party-panel">
      <div className="party-header-card">
        <p className="eyebrow">Area Navigator</p>
        <h2>{areaMeta.label}</h2>
        <p>{areaMeta.description}</p>
      </div>

      <div className="area-switcher">
        {AREA_ORDER.map((areaId) => {
          const area = AREA_META[areaId];
          return (
            <button
              key={areaId}
              className={`area-chip${currentArea === areaId ? " is-active" : ""}`}
              type="button"
              onClick={() => onAreaChange(areaId)}
            >
              <span>{area.label}</span>
              <small>{areaId === DEFAULT_AREA_ID ? "허브" : "파티존"}</small>
            </button>
          );
        })}
      </div>

      <div className="party-board">
        <div className="party-board-header">
          <div>
            <h3>{areaMeta.label} 파티 보드</h3>
            <p>{formatPartyCount(parties)}</p>
          </div>
          {partyMessage ? <span className="party-notice">{partyMessage}</span> : null}
        </div>

        {canCreateParty ? (
          <form className="party-form" onSubmit={onCreateParty}>
            <label>
              파티 제목
              <input
                value={createForm.title}
                maxLength={32}
                onChange={(event) => onCreateFormChange("title", event.target.value)}
                placeholder="예: 3:3 농구 한 판 하실 분"
              />
            </label>
            <label>
              모집 인원
              <select
                value={String(createForm.maxMembers)}
                onChange={(event) => onCreateFormChange("maxMembers", Number(event.target.value))}
              >
                {[2, 3, 4, 5, 6, 8].map((count) => (
                  <option key={count} value={count}>
                    {count}명
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">파티 생성</button>
          </form>
        ) : (
          <div className="party-lobby-card">
            <strong>메인 로비입니다.</strong>
            <p>여기서는 파티를 만들 수 없어요. 원하는 공간으로 이동한 뒤 파티를 생성해보세요.</p>
          </div>
        )}

        <div className="party-list">
          {!canCreateParty ? null : parties.length === 0 ? (
            <div className="party-empty-card">
              <strong>첫 번째 파티를 만들어보세요.</strong>
              <p>현재 공간에 등록된 모집글이 없습니다.</p>
            </div>
          ) : (
            parties.map((party) => {
              const joined = party.members.some((member) => member.id === selfId);
              const isFull = party.members.length >= party.maxMembers;
              return (
                <button
                  key={party.id}
                  className={`party-card${joined ? " is-joined" : ""}`}
                  type="button"
                  onDoubleClick={() => onJoinParty(party.id)}
                >
                  <div className="party-card-head">
                    <strong>{party.title}</strong>
                    <span>
                      {party.members.length}/{party.maxMembers}
                    </span>
                  </div>
                  <p className="party-card-meta">
                    방장 {party.ownerName} · {new Date(party.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                  <div className="party-member-list">
                    {party.members.map((member) => (
                      <span key={member.id}>{member.name}</span>
                    ))}
                  </div>
                  <p className="party-card-tip">
                    {joined
                      ? "이미 참가 중인 파티입니다."
                      : isFull
                        ? "정원이 꽉 찬 파티입니다."
                        : "더블클릭해서 참가하기"}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}