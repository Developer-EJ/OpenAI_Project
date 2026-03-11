import { useState } from "react";
import { HALLS } from "../constants";

export default function AuthScreen({ onSubmit }) {
  const [form, setForm] = useState({
    classroom: "301호",
    name: "",
    hall: HALLS[0]
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="shell shell-auth">
      <div className="auth-panel">
        <div className="hero-copy">
          <p className="eyebrow">Jungle Campus</p>
          <h1>크래프톤 정글 캠퍼스에 오신걸 환영합니다.</h1>
          <p>
            로그인 후 메인 로비에 입장한 다음, 농구장, 교육장, 식당 같은 공간으로 이동할 수 있어요.
            각 공간에서는 전용 파티 게시판으로 같이 움직일 멤버를 모집할 수 있습니다.
          </p>
        </div>
        <form className="auth-card" onSubmit={handleSubmit}>
          <label>
            교육 과정
            <select value={form.hall} onChange={(event) => updateField("hall", event.target.value)}>
              {HALLS.map((hall) => (
                <option key={hall} value={hall}>
                  {hall}
                </option>
              ))}
            </select>
          </label>
          <label>
            교육실
            <input
              value={form.classroom}
              maxLength={10}
              onChange={(event) => updateField("classroom", event.target.value)}
              placeholder="예: 301호"
            />
          </label>
          <label>
            이름
            <input
              value={form.name}
              maxLength={14}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="이름을 입력하세요"
            />
          </label>
          <button type="submit">메인 로비 입장</button>
        </form>
      </div>
    </div>
  );
}