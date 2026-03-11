import { useState } from "react";
import {
  createAvatar,
  HAIR_COLOR_OPTIONS,
  TOP_COLOR_OPTIONS
} from "../avatar";
import { HALLS } from "../constants";

export default function AuthScreen({ onSubmit }) {
  const defaultTop = TOP_COLOR_OPTIONS[0];
  const [form, setForm] = useState({
    classroom: "301호",
    name: "",
    hall: HALLS[0],
    hair: HAIR_COLOR_OPTIONS[0],
    top: defaultTop.top,
    accent: defaultTop.accent
  });

  const previewAvatar = createAvatar({
    hair: form.hair,
    top: form.top,
    accent: form.accent
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateTopColor(top, accent) {
    setForm((current) => ({ ...current, top, accent }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      avatar: previewAvatar
    });
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
          <div className="avatar-picker">
            <div className="avatar-preview-card">
              <span className="avatar-picker-label">캐릭터 미리보기</span>
              <div className="avatar-preview">
                <div className="avatar-preview-shadow" />
                <div
                  className="avatar-preview-body"
                  style={{ background: previewAvatar.top }}
                >
                  <div
                    className="avatar-preview-accent"
                    style={{ background: previewAvatar.accent }}
                  />
                </div>
                <div
                  className="avatar-preview-head"
                  style={{ background: previewAvatar.skin }}
                />
                <div
                  className="avatar-preview-hair"
                  style={{ background: previewAvatar.hair }}
                />
              </div>
            </div>
            <div className="avatar-picker-group">
              <span className="avatar-picker-label">머리색</span>
              <div className="avatar-swatch-row">
                {HAIR_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`avatar-swatch ${form.hair === color ? "is-selected" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateField("hair", color)}
                    aria-label={`머리색 ${color}`}
                  />
                ))}
              </div>
            </div>
            <div className="avatar-picker-group">
              <span className="avatar-picker-label">상의색</span>
              <div className="avatar-swatch-row">
                {TOP_COLOR_OPTIONS.map((choice) => (
                  <button
                    key={`${choice.top}-${choice.accent}`}
                    type="button"
                    className={`avatar-swatch avatar-swatch-dual ${
                      form.top === choice.top && form.accent === choice.accent ? "is-selected" : ""
                    }`}
                    style={{
                      backgroundImage: `linear-gradient(180deg, ${choice.top} 0 68%, ${choice.accent} 68% 100%)`
                    }}
                    onClick={() => updateTopColor(choice.top, choice.accent)}
                    aria-label={`상의색 ${choice.top}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button type="submit">메인 로비 입장</button>
        </form>
      </div>
    </div>
  );
}
