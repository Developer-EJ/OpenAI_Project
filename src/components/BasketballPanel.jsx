function formatSeconds(ms = 0) {
  return Math.max(0, Math.ceil(ms / 1000));
}

export default function BasketballPanel({
  gameState,
  currentZone,
  onStartGame,
  onShoot,
  canStart,
  canShoot
}) {
  const remainingSeconds = formatSeconds(gameState.remainingMs);

  return (
    <section className="mini-game-panel">
      <div className="mini-game-header">
        <div>
          <p className="eyebrow">Basketball Mini Game</p>
          <h2>슛 챌린지</h2>
        </div>
        <span className={`mini-game-pill${gameState.active ? " is-live" : ""}`}>
          {gameState.active ? `${remainingSeconds}s 남음` : "대기 중"}
        </span>
      </div>

      <div className="mini-game-grid">
        <div className={`mini-game-card${currentZone ? " is-highlight" : ""}`}>
          <strong>현재 슛 존</strong>
          <p>
            {currentZone
              ? `${currentZone.label} 존, ${currentZone.points}점, 성공률 ${Math.round(
                  currentZone.successRate * 100
                )}%`
              : "슛 존 안으로 이동하면 슛 버튼이 활성화됩니다."}
          </p>
        </div>
        <div className="mini-game-card">
          <strong>조작 방법</strong>
          <p>`경기 시작` 후 슛 존 안에서 `Space` 또는 `슛하기`를 누르세요.</p>
        </div>
      </div>

      <div className="mini-game-actions">
        <button type="button" className="ghost-button" onClick={onStartGame} disabled={!canStart}>
          경기 시작
        </button>
        <button type="button" onClick={onShoot} disabled={!canShoot}>
          슛하기
        </button>
      </div>

      {gameState.lastShot ? (
        <div className="mini-game-card is-highlight">
          <strong>최근 슛</strong>
          <p>{gameState.lastShot.message}</p>
        </div>
      ) : null}

      <div className="mini-game-card scoreboard-card">
        <strong>점수판</strong>
        {gameState.scoreboard.length === 0 ? (
          <p>아직 점수가 없습니다. 첫 득점을 만들어보세요.</p>
        ) : (
          <ol className="scoreboard-list">
            {gameState.scoreboard.map((entry) => (
              <li key={entry.id}>
                <span>{entry.name}</span>
                <strong>{entry.score}점</strong>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
