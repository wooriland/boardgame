import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBoardPosts,
  getStoredBoardAdminToken,
  saveBoardAdminToken,
} from "../../api/boardApi";
import BoardAdminSidePanel from "../../components/admin/BoardAdminSidePanel";
import {
  formatBoardCommentWindowRange,
  getStoredBoardCommentWindow,
  resolveBoardCommentWindowStatus,
} from "../../utils/boardCommentWindow";
import "./Board.css";

const BOARD_SESSION_KEY = "wooriland-board-session";

const CATEGORY_OPTIONS = [
  { value: "", label: "전체" },
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

function isYes(value) {
  return String(value ?? "").toUpperCase() === "Y";
}

function formatCount(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("ko-KR");
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return String(value);
  }
}

function getCategoryLabel(category) {
  const found = CATEGORY_OPTIONS.find(
    (option) => option.value === String(category ?? "")
  );
  return found?.label ?? String(category ?? "일반");
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

function normalizePostList(responseData) {
  if (!responseData) return [];

  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData.content)) return responseData.content;
  if (Array.isArray(responseData.list)) return responseData.list;
  if (Array.isArray(responseData.items)) return responseData.items;
  if (Array.isArray(responseData.data)) return responseData.data;

  return [];
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

function getPostPreview(post) {
  const raw = String(post?.preview ?? post?.summary ?? post?.content ?? "").trim();
  if (!raw) return "";
  return raw.length > 110 ? `${raw.slice(0, 110)}...` : raw;
}

function getRoleTone(role) {
  const normalized = normalizeRole(role).toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "participant") return "participant";
  return "read_only";
}

function getCommentTone(canComment) {
  return canComment ? "active" : "inactive";
}

function buildSummaryItems({
  boardSession,
  role,
  isAdmin,
  hasAdminToken,
  currentCommentWindow,
}) {
  const commentWindowStatus = resolveBoardCommentWindowStatus(currentCommentWindow);
  const items = [
    {
      label: "게시판 안내",
      value: "공지, 운영 안내, 참여 후기와 일반 게시글",
      tone: "info",
      description: "큰 설명 대신 핵심 상태만 빠르게 확인합니다.",
    },
    {
      label: "현재 권한",
      value: role,
      tone: getRoleTone(role),
    },
    {
      label: "댓글 권한",
      value: isAdmin ? "관리 가능" : boardSession?.canComment ? "가능" : "제한",
      tone: isAdmin ? "info" : getCommentTone(boardSession?.canComment),
    },
    {
      label: "입장 유형",
      value: boardSession?.enteredType || role,
      tone: "info",
    },
    {
      label: "댓글 정책",
      value: isAdmin ? "최종 참여자 공통 기간 설정" : commentWindowStatus.label,
      tone: isAdmin ? "info" : commentWindowStatus.key,
      description: isAdmin
        ? "시작일시와 종료일시를 기준으로 댓글 권한을 관리합니다."
        : currentCommentWindow?.startAt && currentCommentWindow?.endAt
        ? formatBoardCommentWindowRange(currentCommentWindow, { short: true })
        : "운영팀이 설정한 기간에 맞춰 댓글 상태가 안내됩니다.",
    },
  ];

  if (isAdmin) {
    items.push({
      label: "관리자 토큰 상태",
      value: hasAdminToken ? "유지됨" : "없음",
      tone: hasAdminToken ? "active" : "inactive",
    });
  } else if (boardSession?.displayName) {
    items.push({
      label: "표시 이름",
      value: boardSession.displayName,
      tone: "info",
    });
  }

  return items;
}

export default function BoardPage() {
  const navigate = useNavigate();

  const [boardSession, setBoardSession] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [category, setCategory] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentCommentWindow] = useState(() => getStoredBoardCommentWindow());

  useEffect(() => {
    const session = parseBoardSession();
    setBoardSession(session);
  }, []);

  const role = useMemo(() => normalizeRole(boardSession?.role), [boardSession]);
  const isAdmin = role === "ADMIN";

  const resolvedAdminToken = useMemo(
    () => getResolvedAdminToken(boardSession),
    [boardSession]
  );

  const hasAdminToken = Boolean(resolvedAdminToken);

  const summaryItems = useMemo(
    () =>
      buildSummaryItems({
        boardSession,
        role,
        isAdmin,
        hasAdminToken,
        currentCommentWindow,
      }),
    [boardSession, role, isAdmin, hasAdminToken, currentCommentWindow]
  );

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await getBoardPosts({
        category: category || undefined,
        keyword: keyword || undefined,
      });

      setPosts(normalizePostList(result));
    } catch (error) {
      console.error("게시글 목록 조회 실패:", error);
      setPosts([]);
      setErrorMsg(
        extractApiErrorMessage(
          error,
          "게시글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [category, keyword]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handleSearch() {
    setKeyword(keywordInput.trim());
  }

  function handleResetSearch() {
    setCategory("");
    setKeywordInput("");
    setKeyword("");
  }

  function handleMoveDetail(post) {
    const targetPostId =
      post?.postId ?? post?.id ?? post?.boardPostId ?? null;

    if (!targetPostId) {
      window.alert("게시글 번호를 찾을 수 없습니다.");
      return;
    }

    navigate(`/board/${targetPostId}`);
  }

  function renderPostRow(post) {
    const targetPostId =
      post?.postId ?? post?.id ?? post?.boardPostId ?? "unknown";

    return (
      <button
        key={targetPostId}
        type="button"
        className={`board-postCard ${isYes(post.isNotice) ? "board-postCard-notice" : ""} ${
          isYes(post.isHot) ? "board-postCard-hot" : ""
        }`}
        onClick={() => handleMoveDetail(post)}
      >
        <div className="board-postTop">
          <div className="board-postBadges">
            <span className="board-postCategory">
              {getCategoryLabel(post.category)}
            </span>

            {isYes(post.isNotice) && (
              <span className="board-postBadge board-postBadge-notice">공지</span>
            )}

            {isYes(post.isHot) && (
              <span className="board-postBadge board-postBadge-hot">HOT</span>
            )}
          </div>

          <div className="board-postDate">{formatDateTime(post.createdAt)}</div>
        </div>

        <h3 className="board-postTitle">{post.title || "제목 없음"}</h3>

        {getPostPreview(post) ? (
          <p className="board-postPreview">{getPostPreview(post)}</p>
        ) : null}

        <div className="board-postMeta">
          <span>
            작성자 <strong>{post.writerDisplayName || "-"}</strong>
          </span>
          <span>
            역할 <strong>{post.writerRole || "-"}</strong>
          </span>
          <span>
            좋아요 <strong>{formatCount(post.likeCount)}</strong>
          </span>
          <span>
            댓글 <strong>{formatCount(post.commentCount)}</strong>
          </span>
          <span>
            조회 <strong>{formatCount(post.viewCount)}</strong>
          </span>
        </div>
      </button>
    );
  }

  const emptyStateMessage = isAdmin
    ? "등록된 게시글이 없습니다. 관리자 글쓰기로 첫 게시글을 등록할 수 있습니다."
    : "아직 등록된 게시글이 없습니다. 나중에 다시 확인해주세요.";

  return (
    <div className="board-page">
      <div
        className={`board-shell board-shellBoard ${
          isAdmin ? "board-shellAdmin" : "board-shellParticipant"
        }`}
      >
        <header className="board-headerCard">
          <p className="board-eyebrow">WOORILAND BOARD</p>
          <h1 className="board-title">우리랜드 게시판</h1>
          <p className="board-subtitle">
            공지, 운영 안내, 참여 후기와 일반 게시글을 확인할 수 있습니다.
          </p>
        </header>

        <main className="board-mainColumn board-mainArea">
          <section className="board-panel">
            <div className="board-panelHeader board-panelHeader-row">
              <div>
                <h2>게시글 목록</h2>
                <p>목록이 화면의 중심이 되도록 먼저 배치했습니다.</p>
              </div>

              <span className="board-listCount">
                총 {formatCount(posts.length)}건
              </span>
            </div>

            {loading ? (
              <div className="board-emptyState">
                게시글을 불러오는 중입니다...
              </div>
            ) : errorMsg ? (
              <div className="board-message board-message-error">{errorMsg}</div>
            ) : posts.length === 0 ? (
              <div className="board-emptyState">{emptyStateMessage}</div>
            ) : (
              <div className="board-postList">
                {posts.map((post) => renderPostRow(post))}
              </div>
            )}
          </section>

          <section className="board-panel board-searchPanel">
            <div className="board-panelHeader">
              <h2>게시글 검색</h2>
              <p>검색은 보조 기능으로 두고, 목록 아래에서 빠르게 좁혀볼 수 있게 정리했습니다.</p>
            </div>

            <div className="board-searchForm">
              <div className="board-searchFields">
                <div className="board-field">
                  <label htmlFor="boardCategory">카테고리</label>
                  <select
                    id="boardCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={loading}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value || "ALL"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="board-field">
                  <label htmlFor="boardKeyword">검색어</label>
                  <input
                    id="boardKeyword"
                    type="text"
                    placeholder="제목 또는 내용을 검색하세요"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                </div>
              </div>

              <div className="board-formActions">
                <button
                  type="button"
                  className="board-btn board-btnPrimary"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  검색
                </button>

                <button
                  type="button"
                  className="board-btn board-btnGhost"
                  onClick={handleResetSearch}
                  disabled={loading}
                >
                  초기화
                </button>

                <button
                  type="button"
                  className="board-btn board-btnGhost"
                  onClick={fetchPosts}
                  disabled={loading}
                >
                  새로고침
                </button>
              </div>
            </div>
          </section>

          <div className="board-bottomActions">
            <button
              type="button"
              className="board-btn board-btnGhost"
              onClick={() => navigate("/board/enter")}
            >
              입장 화면으로
            </button>

            {isAdmin && hasAdminToken && (
              <button
                type="button"
                className="board-btn board-btnPrimary"
                onClick={() => navigate("/board/admin/new")}
              >
                관리자 글쓰기
              </button>
            )}
          </div>
        </main>

        <aside className="board-summaryColumn board-summaryArea">
          <section className="board-summaryPanel">
            <div className="board-summaryHeader">
              <p className="board-sideEyebrow">STATUS SUMMARY</p>
              <h2 className="board-summaryTitle">상태 요약</h2>
              <p className="board-summaryText">
                긴 설명 카드 대신 현재 권한과 운영 상태를 짧게 정리했습니다.
              </p>
            </div>

            <div className="board-summaryGrid">
              {summaryItems.map((item) => (
                <div key={item.label} className="board-summaryItem">
                  <span className="board-summaryLabel">{item.label}</span>
                  <div className="board-summaryValue">
                    <span className={`board-statusBadge is-${item.tone}`}>
                      {item.value}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="board-summaryNote">{item.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </aside>

        {isAdmin && (
          <aside className="board-operationsColumn board-operationsArea">
            <BoardAdminSidePanel adminToken={resolvedAdminToken} />
          </aside>
        )}
      </div>
    </div>
  );
}
