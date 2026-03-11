export default function ChatPanel({
  messages,
  input,
  scope,
  onInputChange,
  onScopeChange,
  onSubmit
}) {
  return (
    <aside className="chat-panel">
      <div className="chat-header">
        <h2>채팅</h2>
        <select value={scope} onChange={(event) => onScopeChange(event.target.value)}>
          <option value="global">전체 채팅</option>
          <option value="nearby">근처 채팅</option>
        </select>
      </div>
      <div className="chat-log">
        {messages.length === 0 ? (
          <p className="chat-empty">첫 인사를 남겨보세요.</p>
        ) : (
          messages.map((message) => (
            <div className="chat-item" key={message.id}>
              <strong>{message.senderName}</strong>
              <span className="chat-meta">{message.classroom}</span>
              <p>{message.message}</p>
            </div>
          ))
        )}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
        <input
          value={input}
          maxLength={120}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="메시지를 입력하세요"
        />
        <button type="submit">전송</button>
      </form>
    </aside>
  );
}
