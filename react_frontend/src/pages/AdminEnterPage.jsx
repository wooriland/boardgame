import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  clearAdminOperationsToken,
  getAdminOperationsToken,
  maskAdminOperationsToken,
  setAdminOperationsToken,
} from "../utils/adminSession";
import "./AdminOperationPage.css";

export default function AdminEnterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [savedToken, setSavedToken] = useState(() => getAdminOperationsToken());
  const [token, setToken] = useState(() => getAdminOperationsToken());
  const [localMessage, setLocalMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const routeMessage =
    typeof location.state?.message === "string" ? location.state.message : "";

  const displayMessage = localMessage || routeMessage;

  function handleSubmit(e) {
    e.preventDefault();

    const value = String(token || "").trim();
    if (!value) {
      setErrorMessage("운영 관리자 토큰을 입력해주세요.");
      return;
    }

    setAdminOperationsToken(value);
    setSavedToken(value);
    setLocalMessage("");
    setErrorMessage("");

    navigate("/admin/operations", { replace: true });
  }

  function handleClearSavedToken() {
    clearAdminOperationsToken();
    setSavedToken("");
    setToken("");
    setLocalMessage("저장된 운영 관리자 토큰을 삭제했습니다.");
    setErrorMessage("");
  }

  function handleUseSavedToken() {
    const saved = String(savedToken || "").trim();

    if (!saved) {
      setErrorMessage("저장된 토큰이 없습니다.");
      return;
    }

    setLocalMessage("");
    setErrorMessage("");
    navigate("/admin/operations", { replace: true });
  }

  return (
    <div className="admin-op-page">
      <div className="admin-op-container admin-op-container--narrow">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h1 className="admin-page-title">운영 관리자 입장</h1>
              <p className="admin-page-subtitle">
                참석/선발 운영 화면에 들어가기 위한 관리자 토큰을 입력하세요.
              </p>
            </div>
          </div>

          {displayMessage ? (
            <div className="admin-message admin-message--info">
              {displayMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="admin-message admin-message--error">
              {errorMessage}
            </div>
          ) : null}

          <form className="admin-form" onSubmit={handleSubmit}>
            <label className="admin-field">
              <span className="admin-label">운영 관리자 토큰</span>
              <input
                type="password"
                className="admin-input"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setLocalMessage("");
                  setErrorMessage("");
                }}
                placeholder="운영 관리자 토큰을 입력하세요"
                autoComplete="off"
              />
            </label>

            <div className="admin-actions">
              <button type="submit" className="admin-btn admin-btn--primary">
                운영 화면으로 이동
              </button>
            </div>
          </form>

          <div className="admin-divider" />

          <div className="admin-saved-token-box">
            <div>
              <div className="admin-label">현재 저장된 토큰</div>
              <div className="admin-saved-token-value">
                {savedToken ? maskAdminOperationsToken(savedToken) : "없음"}
              </div>
            </div>

            <div className="admin-actions">
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={handleUseSavedToken}
                disabled={!savedToken}
              >
                저장된 토큰으로 계속
              </button>

              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={handleClearSavedToken}
                disabled={!savedToken}
              >
                저장 토큰 삭제
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}