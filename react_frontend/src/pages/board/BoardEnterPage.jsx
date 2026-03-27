import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  enterBoardReadOnly,
  enterBoardParticipant,
  enterBoardAdmin,
  clearBoardAdminToken,
  clearBoardSession,
  saveBoardSession,
  resolveBoardCanComment,
} from "../../api/boardApi";
import "./Board.css";

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function normalizeRole(value) {
  return String(value ?? "READ_ONLY").trim().toUpperCase();
}

function createSessionPayload({
  role,
  displayName,
  dept,
  name,
  phone,
  canComment,
  enteredType,
  adminToken,
}) {
  return {
    role: normalizeRole(role),
    displayName: displayName ?? "게시판 이용자",
    dept: dept ?? "",
    name: name ?? "",
    phone: phone ?? "",
    canComment: Boolean(canComment),
    enteredType: normalizeRole(enteredType ?? role),
    adminToken: adminToken ?? "",
    enteredAt: new Date().toISOString(),
  };
}

function extractApiErrorMessage(error, fallbackMessage) {
  if (error?.body?.message) return error.body.message;
  if (error?.body?.error) return error.body.error;

  if (typeof error?.bodyText === "string" && error.bodyText.trim()) {
    return error.bodyText;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export default function BoardEnterPage() {
  const navigate = useNavigate();

  const [dept, setDept] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({
    type: "info",
    text: "읽기 전용으로 입장하거나, 참여 정보를 입력해 게시판에 들어갈 수 있습니다.",
  });

  const isAdminSecret = useMemo(() => {
    return (
      normalizeValue(dept) === "그외" &&
      normalizeValue(name) === "매니저" &&
      normalizeValue(phone) === "1234"
    );
  }, [dept, name, phone]);

  function setInfoMessage(text) {
    setMsg({ type: "info", text });
  }

  function setSuccessMessage(text) {
    setMsg({ type: "success", text });
  }

  function setErrorMessage(text) {
    setMsg({ type: "error", text });
  }

  function validateParticipantForm() {
    if (!normalizeValue(dept)) {
      setErrorMessage("소속 부서를 입력해 주세요.");
      return false;
    }

    if (!normalizeValue(name)) {
      setErrorMessage("이름을 입력해 주세요.");
      return false;
    }

    if (!normalizeValue(phone)) {
      setErrorMessage("연락처를 입력해 주세요.");
      return false;
    }

    return true;
  }

  async function handleEnterReadOnly() {
    setLoading(true);
    setInfoMessage("읽기 전용 입장을 확인하고 있습니다...");

    try {
      clearBoardAdminToken();
      clearBoardSession();

      const result = await enterBoardReadOnly();

      const sessionPayload = createSessionPayload({
        role: "READ_ONLY",
        displayName: result?.displayName ?? "읽기 전용 이용자",
        dept: "",
        name: "",
        phone: "",
        canComment: false,
        enteredType: "READ_ONLY",
        adminToken: "",
      });

      saveBoardSession(sessionPayload);

      setSuccessMessage("읽기 전용으로 입장했습니다. 게시글을 확인할 수 있습니다.");

      setTimeout(() => {
        navigate("/board");
      }, 500);
    } catch (error) {
      console.error("읽기 전용 입장 실패:", error);
      setErrorMessage(
        extractApiErrorMessage(
          error,
          "읽기 전용 입장 중 오류가 발생했습니다."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEnterByForm() {
    if (!validateParticipantForm()) return;

    const trimmedDept = normalizeValue(dept);
    const trimmedName = normalizeValue(name);
    const trimmedPhone = normalizeValue(phone);

    setLoading(true);

    try {
      if (isAdminSecret) {
        setInfoMessage("관리자 입장을 확인하고 있습니다...");

        const result = await enterBoardAdmin({
          dept: trimmedDept,
          name: trimmedName,
          phone: trimmedPhone,
        });

        const resolvedAdminToken = String(result?.adminToken ?? "").trim();

        const sessionPayload = createSessionPayload({
          role: "ADMIN",
          displayName: result?.displayName ?? "관리자",
          dept: trimmedDept,
          name: trimmedName,
          phone: trimmedPhone,
          canComment: true,
          enteredType: "ADMIN",
          adminToken: resolvedAdminToken,
        });

        saveBoardSession(sessionPayload);

        setSuccessMessage(
          resolvedAdminToken
            ? "관리자 권한으로 입장했습니다."
            : "관리자 권한으로 입장했습니다. 단, 관리자 토큰이 응답에 없어 일부 기능이 제한될 수 있습니다."
        );

        setTimeout(() => {
          navigate("/board");
        }, 500);

        return;
      }

      clearBoardAdminToken();
      setInfoMessage("참여자 정보를 확인하고 있습니다...");

      const result = await enterBoardParticipant({
        dept: trimmedDept,
        name: trimmedName,
        phone: trimmedPhone,
      });

      const apiRole = normalizeRole(result?.role ?? result?.enteredType);
      const apiCanComment = Boolean(resolveBoardCanComment(result, false));

      const isParticipantApproved =
        apiCanComment || apiRole === "PARTICIPANT";

      const sessionPayload = createSessionPayload({
        role: isParticipantApproved ? "PARTICIPANT" : "READ_ONLY",
        displayName: result?.displayName ?? trimmedName,
        dept: trimmedDept,
        name: trimmedName,
        phone: trimmedPhone,
        canComment: isParticipantApproved,
        enteredType: isParticipantApproved ? "PARTICIPANT" : "READ_ONLY",
        adminToken: "",
      });

      saveBoardSession(sessionPayload);

      if (isParticipantApproved) {
        setSuccessMessage(
          result?.message ||
            `${sessionPayload.displayName}님, 이번 주 최종 참여자로 확인되어 댓글 작성이 가능합니다.`
        );
      } else {
        setInfoMessage(
          result?.message ||
            "이번 주 최종 참여자로 확인되지 않아 읽기 전용으로 입장합니다."
        );
      }

      setTimeout(() => {
        navigate("/board");
      }, 500);
    } catch (error) {
      console.error("게시판 입장 실패:", error);
      setErrorMessage(
        extractApiErrorMessage(
          error,
          "입장 정보를 확인하지 못했습니다. 입력값을 다시 확인해 주세요."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleResetForm() {
    setDept("");
    setName("");
    setPhone("");
    setInfoMessage(
      "읽기 전용으로 입장하거나, 참여 정보를 입력해 게시판에 들어갈 수 있습니다."
    );
  }

  return (
    <div className="board-page">
      <div className="board-shell board-enter">
        <header className="board-headerCard">
          <p className="board-eyebrow">WOORILAND BOARD</p>
          <h1 className="board-title">우리랜드 게시판 입장</h1>
          <p className="board-subtitle">
            참여하지 않았더라도 게시글은 읽을 수 있습니다.
            <br />
            이번 주 최종 참여자로 확인되면 댓글 작성이 가능합니다.
          </p>
        </header>

        <section className="board-panel">
          <div className="board-panelHeader">
            <h2>입장 방식 선택</h2>
            <p>읽기 전용 또는 참여자 인증 중 하나를 선택하세요.</p>
          </div>

          <div className="board-enterActions">
            <button
              type="button"
              className="board-btn board-btnSecondary"
              onClick={handleEnterReadOnly}
              disabled={loading}
            >
              {loading ? "처리 중..." : "읽기 전용으로 입장"}
            </button>
          </div>
        </section>

        <section className="board-panel">
          <div className="board-panelHeader">
            <h2>참여자 정보 입력</h2>
            <p>
              소속 부서, 이름, 연락처를 입력하면 이번 주 최종 참여자 여부를
              확인한 뒤 댓글 작성 가능 여부가 결정됩니다.
            </p>
          </div>

          <div className="board-form">
            <div className="board-field">
              <label htmlFor="boardDept">소속 부서</label>
              <input
                id="boardDept"
                type="text"
                placeholder="예: 1청년부 / 2청년부 / 3청년부 / 4청년부 / 그외"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="board-field">
              <label htmlFor="boardName">이름</label>
              <input
                id="boardName"
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="board-field">
              <label htmlFor="boardPhone">연락처</label>
              <input
                id="boardPhone"
                type="text"
                placeholder="예: 010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="board-formActions">
              <button
                type="button"
                className="board-btn board-btnPrimary"
                onClick={handleEnterByForm}
                disabled={loading}
              >
                {loading
                  ? "입장 확인 중..."
                  : isAdminSecret
                  ? "관리자 권한으로 입장"
                  : "참여자 권한 확인"}
              </button>

              <button
                type="button"
                className="board-btn board-btnGhost"
                onClick={handleResetForm}
                disabled={loading}
              >
                입력 초기화
              </button>
            </div>
          </div>
        </section>

        <section className="board-panel">
          <div className="board-panelHeader">
            <h2>입장 안내</h2>
          </div>

          <div className={`board-message board-message-${msg.type}`}>
            {msg.text}
          </div>

          <div className="board-guide">
            <div className="board-guideItem">
              <strong>읽기 전용</strong>
              <span>게시글/댓글 열람 가능, 작성 기능 제한</span>
            </div>
            <div className="board-guideItem">
              <strong>참여자</strong>
              <span>이번 주 최종 참여자로 확인되면 댓글 작성 가능</span>
            </div>
            <div className="board-guideItem">
              <strong>관리자</strong>
              <span>게시글 작성/수정/삭제 및 참여자 운영 기능 사용 가능</span>
            </div>
          </div>
        </section>

        <div className="board-bottomActions">
          <button
            type="button"
            className="board-btn board-btnGhost"
            onClick={() => navigate("/")}
            disabled={loading}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}