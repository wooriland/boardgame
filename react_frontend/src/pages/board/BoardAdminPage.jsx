import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createBoardPostByAdmin,
  updateBoardPostByAdmin,
  getBoardPostDetail,
  getStoredBoardAdminToken,
  saveBoardAdminToken,
} from "../../api/boardApi";
import "./Board.css";

const BOARD_SESSION_KEY = "wooriland-board-session";

const CATEGORY_OPTIONS = [
  { value: "NOTICE", label: "공지" },
  { value: "GUIDE", label: "운영 안내" },
  { value: "REVIEW", label: "참여 후기" },
  { value: "FREE", label: "일반" },
];

function parseBoardSession() {
  try {
    const raw = sessionStorage.getItem(BOARD_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.error("게시판 세션 파싱 실패:", error);
    return null;
  }
}

function normalizeRole(role) {
  return String(role ?? "READ_ONLY").toUpperCase();
}

function toYN(value) {
  return value ? "Y" : "N";
}

function fromYN(value) {
  return String(value ?? "").toUpperCase() === "Y";
}

function getDisplayName(session) {
  return (
    session?.displayName ||
    session?.name ||
    (normalizeRole(session?.role) === "ADMIN" ? "관리자" : "게시판 이용자")
  );
}

function getResolvedAdminToken(session) {
  const sessionToken = String(session?.adminToken ?? "").trim();
  const storedToken = String(getStoredBoardAdminToken() ?? "").trim();

  if (storedToken) return storedToken;
  if (sessionToken) {
    saveBoardAdminToken(sessionToken);
    return sessionToken;
  }
  return "";
}

function normalizePostDetail(responseData) {
  if (!responseData || typeof responseData !== "object") return null;

  if (responseData.post && typeof responseData.post === "object") {
    return responseData.post;
  }

  if (responseData.item && typeof responseData.item === "object") {
    return responseData.item;
  }

  if (responseData.data && typeof responseData.data === "object") {
    return responseData.data;
  }

  if (
    responseData.postId != null ||
    responseData.title != null ||
    responseData.content != null
  ) {
    return responseData;
  }

  return null;
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

export default function BoardAdminPage() {
  const navigate = useNavigate();
  const { postId } = useParams();

  const [boardSession, setBoardSession] = useState(null);

  const [category, setCategory] = useState("FREE");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [isHot, setIsHot] = useState(false);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState({
    type: "info",
    text: "관리자 권한으로 게시글을 작성하거나 수정할 수 있습니다.",
  });

  const isEditMode = useMemo(() => Boolean(postId), [postId]);
  const role = useMemo(() => normalizeRole(boardSession?.role), [boardSession]);
  const isAdmin = role === "ADMIN";
  const adminToken = useMemo(
    () => getResolvedAdminToken(boardSession),
    [boardSession]
  );

  useEffect(() => {
    const session = parseBoardSession();
    setBoardSession(session);
  }, []);

  useEffect(() => {
    async function fetchPostDetail() {
      if (!isEditMode || !postId) return;

      setLoadingDetail(true);
      setMsg({
        type: "info",
        text: "수정할 게시글 정보를 불러오는 중입니다.",
      });

      try {
        const result = await getBoardPostDetail(postId);
        const post = normalizePostDetail(result);

        if (!post) {
          setMsg({
            type: "error",
            text: "수정할 게시글 정보를 해석하지 못했습니다.",
          });
          return;
        }

        setCategory(post.category || "FREE");
        setTitle(post.title || "");
        setContent(post.content || "");
        setIsNotice(fromYN(post.isNotice));
        setIsHot(fromYN(post.isHot));

        setMsg({
          type: "success",
          text: "게시글 정보를 불러왔습니다. 내용을 수정한 뒤 저장하세요.",
        });
      } catch (error) {
        console.error("게시글 상세 조회 실패:", error);
        setMsg({
          type: "error",
          text: extractApiErrorMessage(
            error,
            "수정할 게시글 정보를 불러오지 못했습니다."
          ),
        });
      } finally {
        setLoadingDetail(false);
      }
    }

    fetchPostDetail();
  }, [isEditMode, postId]);

  useEffect(() => {
    if (boardSession && !isAdmin) {
      setMsg({
        type: "error",
        text: "관리자 권한이 없습니다. 게시판 목록으로 돌아가 주세요.",
      });
      return;
    }

    if (boardSession && isAdmin && !adminToken) {
      setMsg({
        type: "error",
        text: "관리자 토큰이 없습니다. /board/enter 에서 다시 관리자 인증 후 시도해 주세요.",
      });
    }
  }, [boardSession, isAdmin, adminToken]);

  function validateForm() {
    if (!category) {
      setMsg({
        type: "error",
        text: "카테고리를 선택해 주세요.",
      });
      return false;
    }

    if (!title.trim()) {
      setMsg({
        type: "error",
        text: "제목을 입력해 주세요.",
      });
      return false;
    }

    if (!content.trim()) {
      setMsg({
        type: "error",
        text: "내용을 입력해 주세요.",
      });
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (!isAdmin) {
      setMsg({
        type: "error",
        text: "관리자만 저장할 수 있습니다.",
      });
      return;
    }

    if (!adminToken) {
      setMsg({
        type: "error",
        text: "관리자 토큰이 없습니다. /board/enter 에서 다시 관리자 인증 후 시도해 주세요.",
      });
      return;
    }

    if (!validateForm()) return;

    setSaving(true);
    setMsg({
      type: "info",
      text: isEditMode
        ? "게시글을 수정하는 중입니다."
        : "게시글을 등록하는 중입니다.",
    });

    const payload = {
      category,
      title: title.trim(),
      content: content.trim(),
      isNotice: toYN(isNotice),
      isHot: toYN(isHot),
      writerRole: "ADMIN",
      writerDisplayName: getDisplayName(boardSession),
    };

    try {
      const result = isEditMode
        ? await updateBoardPostByAdmin(postId, payload)
        : await createBoardPostByAdmin(payload);

      setMsg({
        type: "success",
        text: isEditMode
          ? "게시글이 수정되었습니다."
          : "게시글이 등록되었습니다.",
      });

      const savedPostId =
        result?.postId ??
        result?.data?.postId ??
        result?.id ??
        postId;

      window.setTimeout(() => {
        if (savedPostId) {
          navigate(`/board/${savedPostId}`);
        } else {
          navigate("/board");
        }
      }, 500);
    } catch (error) {
      console.error("게시글 저장 실패:", error);

      const rawMessage = extractApiErrorMessage(
        error,
        "게시글 저장 중 오류가 발생했습니다."
      );

      const normalizedMessage = String(rawMessage ?? "");
      const tokenError =
        normalizedMessage.includes("관리자 토큰") ||
        normalizedMessage.includes("Unauthorized") ||
        normalizedMessage.includes("401");

      setMsg({
        type: "error",
        text: tokenError
          ? "관리자 인증이 만료되었거나 토큰이 올바르지 않습니다. /board/enter 에서 다시 관리자 입장을 진행해 주세요."
          : normalizedMessage,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (isEditMode) {
      window.location.reload();
      return;
    }

    setCategory("FREE");
    setTitle("");
    setContent("");
    setIsNotice(false);
    setIsHot(false);
    setMsg({
      type: "info",
      text: "입력값을 초기화했습니다.",
    });
  }

  if (boardSession && !isAdmin) {
    return (
      <div className="board-page">
        <div className="board-shell board-adminPage">
          <section className="board-panel">
            <div className="board-panelHeader">
              <h2>관리자 전용 페이지</h2>
              <p>현재 계정으로는 이 화면에 접근할 수 없습니다.</p>
            </div>

            <div className="board-message board-message-error">
              관리자 권한이 확인되지 않았습니다.
            </div>

            <div className="board-bottomActions">
              <button
                type="button"
                className="board-btn board-btnGhost"
                onClick={() => navigate("/board")}
              >
                게시판으로 돌아가기
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="board-page">
      <div className="board-shell board-adminPage">
        <header className="board-headerCard">
          <p className="board-eyebrow">WOORILAND BOARD ADMIN</p>
          <h1 className="board-title">
            {isEditMode ? "게시글 수정" : "게시글 작성"}
          </h1>
          <p className="board-subtitle">
            관리자 권한으로 게시판 글을 작성하거나 수정할 수 있습니다.
          </p>
        </header>

        <section className="board-panel">
          <div className="board-panelHeader">
            <h2>{isEditMode ? "수정 정보 입력" : "작성 정보 입력"}</h2>
            <p>
              카테고리, 제목, 내용을 입력하고 공지 여부와 HOT 여부를 선택하세요.
            </p>
          </div>

          <div className={`board-message board-message-${msg.type}`}>
            {msg.text}
          </div>

          <div className="board-form board-adminForm">
            <div className="board-field">
              <label htmlFor="boardCategory">카테고리</label>
              <select
                id="boardCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving || loadingDetail}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="board-field">
              <label htmlFor="boardTitle">제목</label>
              <input
                id="boardTitle"
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving || loadingDetail}
              />
            </div>

            <div className="board-field">
              <label htmlFor="boardContent">내용</label>
              <textarea
                id="boardContent"
                className="board-adminTextarea"
                placeholder="게시글 내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={saving || loadingDetail}
              />
            </div>

            <div className="board-adminChecks">
              <label className="board-checkItem">
                <input
                  type="checkbox"
                  checked={isNotice}
                  onChange={(e) => setIsNotice(e.target.checked)}
                  disabled={saving || loadingDetail}
                />
                <span>공지글로 등록</span>
              </label>

              <label className="board-checkItem">
                <input
                  type="checkbox"
                  checked={isHot}
                  onChange={(e) => setIsHot(e.target.checked)}
                  disabled={saving || loadingDetail}
                />
                <span>HOT 글로 표시</span>
              </label>
            </div>

            <div className="board-formActions">
              <button
                type="button"
                className="board-btn board-btnPrimary"
                onClick={handleSave}
                disabled={saving || loadingDetail}
              >
                {saving
                  ? isEditMode
                    ? "수정 중..."
                    : "등록 중..."
                  : isEditMode
                  ? "수정 저장"
                  : "게시글 등록"}
              </button>

              <button
                type="button"
                className="board-btn board-btnGhost"
                onClick={handleReset}
                disabled={saving || loadingDetail}
              >
                {isEditMode ? "다시 불러오기" : "입력 초기화"}
              </button>

              <button
                type="button"
                className="board-btn board-btnSecondary"
                onClick={() => navigate("/board")}
                disabled={saving}
              >
                목록으로
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}