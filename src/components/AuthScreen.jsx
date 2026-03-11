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
            회원가입과 로그인을 하나의 빠른 입장 흐름으로 구성했습니다.
            교육 과정, 교육실, 이름만 입력하면 바로 2D 공간에 접속할 수 있습니다.
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
          <button type="submit">교육장 입장</button>
        </form>
      </div>
    </div>
  );
}
