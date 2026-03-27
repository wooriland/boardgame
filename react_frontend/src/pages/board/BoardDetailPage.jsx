import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getBoardPostDetail,
  increaseBoardPostViewCount,
  getBoardComments,
  createBoardComment,
  deleteBoardComment,
  toggleBoardPostLike,
  deleteBoardPostByAdmin,
  getStoredBoardAdminToken,
  saveBoardAdminToken,
  getStoredBoardSession,
  saveBoardSession,
  refreshBoardSession,
  resolveBoardCanComment,
} from "../../api/boardApi";
import "./Board.css";

/**
 * 개발모드 StrictMode에서 상세 진입 시 조회수 증가 API가 2번 호출되는 것을 막기 위한 장치
 * - production 에서는 사용되지 않음
 * - dev 에서만 postId 기준으로 1회 증가 제한
 */
const devViewedPostIds = new Set();

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
  const value = String(category ?? "").trim();
  return value || "일반";
}

function looksLikePost(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value.postId != null || value.title != null || value.content != null)
  );
}

function normalizePostDetailResponse(responseData) {
  if (!responseData || typeof responseData !== "object") {
    return { post: null, access: {} };
  }

  const container =
    responseData?.data &&
    typeof responseData.data === "object" &&
    !Array.isArray(responseData.data)
      ? responseData.data
      : responseData;

  const candidates = [
    container?.post,
    container?.item,
    container?.data,
    container,
    responseData?.post,
    responseData?.item,
    responseData?.data,
    responseData,
  ];

  let post = null;

  for (const candidate of candidates) {
    if (looksLikePost(candidate)) {
      post = candidate;
      break;
    }
  }

  const access =
    (container?.access && typeof container.access === "object"
      ? container.access
      : null) ||
    (container?.viewer && typeof container.viewer === "object"
      ? container.viewer
      : null) ||
    (container?.permission && typeof container.permission === "object"
      ? container.permission
      : null) ||
    (container?.postAccess && typeof container.postAccess === "object"
      ? container.postAccess
      : null) ||
    (responseData?.access && typeof responseData.access === "object"
      ? responseData.access
      : null) ||
    (responseData?.viewer && typeof responseData.viewer === "object"
      ? responseData.viewer
      : null) ||
    (responseData?.permission && typeof responseData.permission === "object"
      ? responseData.permission
      : null) ||
    (responseData?.postAccess && typeof responseData.postAccess === "object"
      ? responseData.postAccess
      : null) ||
    {};

  return { post, access };
}

function buildCommentItems(responseData) {
  if (!responseData) return [];

  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData.content)) return responseData.content;
  if (Array.isArray(responseData.list)) return responseData.list;
  if (Array.isArray(responseData.data)) return responseData.data;
  if (Array.isArray(responseData.comments)) return responseData.comments;

  return [];
}

function groupComments(commentItems) {
  const normalized = commentItems
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      ...item,
      commentId: item.commentId,
      parentCommentId:
        item.parentCommentId ??
        item.parentId ??
        item.parentBoardCommentId ??
        null,
      children: [],
    }))
    .filter((item) => item.commentId != null);

  const map = new Map();
  normalized.forEach((item) => {
    map.set(item.commentId, item);
  });

  const roots = [];

  normalized.forEach((item) => {
    if (item.parentCommentId && map.has(item.parentCommentId)) {
      map.get(item.parentCommentId).children.push(item);
    } else {
      roots.push(item);
    }
  });

  return roots;
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

function buildBoardIdentity(session) {
  return {
    dept: session?.dept ?? "",
    name: session?.name ?? "",
    phone: session?.phone ?? "",
  };
}

function isPermissionDeniedError(error) {
  const status = Number(error?.status ?? error?.response?.status ?? 0);
  const text = String(
    error?.body?.message ??
      error?.body?.error ??
      error?.bodyText ??
      error?.message ??
      ""
  ).toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    text.includes("forbidden") ||
    text.includes("unauthorized") ||
    text.includes("권한") ||
    text.includes("댓글") ||
    text.includes("참여자")
  );
}

export default function BoardDetailPage() {
  const navigate = useNavigate();
  const { postId } = useParams();

  const [boardSession, setBoardSession] = useState(null);

  const [post, setPost] = useState(null);
  const [postAccess, setPostAccess] = useState({});
  const [comments, setComments] = useState([]);

  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [processingLike, setProcessingLike] = useState(false);
  const [processingDelete, setProcessingDelete] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [commentMsg, setCommentMsg] = useState({
    type: "info",
    text: "이번 주 최종 참여자 또는 관리자 권한이면 댓글을 작성할 수 있습니다.",
  });

  const [commentContent, setCommentContent] = useState("");
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const accessRefreshOnceRef = useRef(false);

  const applyBoardSessionPatch = useCallback((patch) => {
    setBoardSession((prev) => {
      const base = prev || getStoredBoardSession() || {};
      const next = {
        ...base,
        ...patch,
      };
      saveBoardSession(next);
      return next;
    });
  }, []);

  const refreshCurrentBoardSession = useCallback(async () => {
    const current = getStoredBoardSession();

    if (!current || typeof current !== "object") {
      return null;
    }

    const currentRole = normalizeRole(current.role ?? current.enteredType);
    const hasIdentity = Boolean(
      String(current.dept ?? "").trim() &&
        String(current.name ?? "").trim() &&
        String(current.phone ?? "").trim()
    );

    if (currentRole === "PARTICIPANT" && !hasIdentity) {
      return current;
    }

    if (currentRole === "ADMIN" && !hasIdentity) {
      return current;
    }

    try {
      const refreshed = await refreshBoardSession(current);

      if (refreshed && typeof refreshed === "object") {
        setBoardSession(refreshed);
        return refreshed;
      }

      return current;
    } catch (error) {
      console.error("게시판 권한 갱신 실패:", error);
      return current;
    }
  }, []);

  useEffect(() => {
    const session = getStoredBoardSession();
    setBoardSession(session);
  }, []);

  const role = useMemo(
    () =>
      normalizeRole(
        boardSession?.role ??
          boardSession?.enteredType ??
          postAccess?.role ??
          postAccess?.viewerRole
      ),
    [boardSession, postAccess]
  );

  const isAdmin = role === "ADMIN";

  const sessionCanComment = resolveBoardCanComment(boardSession);
  const detailCanComment = resolveBoardCanComment(postAccess, resolveBoardCanComment(post));

  const canComment = Boolean(
    isAdmin || (detailCanComment ?? sessionCanComment ?? false)
  );

  const boardIdentity = useMemo(
    () => buildBoardIdentity(boardSession),
    [boardSession]
  );

  const hasBoardIdentity = useMemo(() => {
    return Boolean(
      String(boardIdentity.dept ?? "").trim() &&
        String(boardIdentity.name ?? "").trim() &&
        String(boardIdentity.phone ?? "").trim()
    );
  }, [boardIdentity]);

  const canWriteComment = Boolean(canComment && hasBoardIdentity);
  const canLike = Boolean(canComment && hasBoardIdentity);

  const adminToken = useMemo(
    () => getResolvedAdminToken(boardSession),
    [boardSession]
  );
  const hasAdminToken = Boolean(adminToken);

  useEffect(() => {
    if (!boardSession || accessRefreshOnceRef.current) return;

    accessRefreshOnceRef.current = true;
    refreshCurrentBoardSession();
  }, [boardSession, refreshCurrentBoardSession]);

  useEffect(() => {
    setCommentMsg((prev) => {
      if (prev.type !== "info") return prev;

      return {
        type: "info",
        text: canWriteComment
          ? "이번 주 최종 참여자 또는 관리자 권한으로 댓글을 작성할 수 있습니다."
          : "현재는 읽기 전용입니다. 이번 주 최종 참여자로 확인되면 댓글을 작성할 수 있습니다.",
      };
    });
  }, [canWriteComment]);

  const fetchPostDetail = useCallback(async () => {
    if (!postId) {
      setPost(null);
      setPostAccess({});
      setErrorMsg("게시글 번호가 없어 상세 화면을 열 수 없습니다.");
      setLoadingPost(false);
      return null;
    }

    setLoadingPost(true);
    setErrorMsg("");

    try {
      const result = await getBoardPostDetail(postId);
      const normalized = normalizePostDetailResponse(result);

      if (!normalized.post) {
        setPost(null);
        setPostAccess({});
        setErrorMsg("게시글 상세 응답 형식을 확인해 주세요.");
        return null;
      }

      setPost(normalized.post);
      setPostAccess(normalized.access ?? {});

      const resolvedCanComment = resolveBoardCanComment(normalized.access);
      if (resolvedCanComment !== undefined) {
        applyBoardSessionPatch({ canComment: resolvedCanComment });
      }

      return normalized.post;
    } catch (error) {
      console.error("게시글 상세 조회 실패:", error);
      setPost(null);
      setPostAccess({});
      setErrorMsg(
        extractApiErrorMessage(
          error,
          "게시글 상세 내용을 불러오지 못했습니다."
        )
      );
      return null;
    } finally {
      setLoadingPost(false);
    }
  }, [applyBoardSessionPatch, postId]);

  const fetchComments = useCallback(async () => {
    if (!postId) {
      setComments([]);
      setLoadingComments(false);
      return [];
    }

    setLoadingComments(true);

    try {
      const result = await getBoardComments(postId);
      const items = buildCommentItems(result);
      const grouped = groupComments(items);
      setComments(grouped);
      return grouped;
    } catch (error) {
      console.error("댓글 목록 조회 실패:", error);
      setComments([]);
      setCommentMsg({
        type: "error",
        text: extractApiErrorMessage(
          error,
          "댓글 목록을 불러오지 못했습니다."
        ),
      });
      return [];
    } finally {
      setLoadingComments(false);
    }
  }, [postId]);

  const increasePostView = useCallback(async () => {
    if (!postId) return null;

    const normalizedPostId = String(postId);

    if (import.meta.env.DEV) {
      if (devViewedPostIds.has(normalizedPostId)) {
        return null;
      }
      devViewedPostIds.add(normalizedPostId);
    }

    try {
      const result = await increaseBoardPostViewCount(postId);

      const resolvedViewCount =
        result?.viewCount ??
        result?.data?.viewCount ??
        result?.result?.viewCount ??
        null;

      const numericViewCount = Number(resolvedViewCount);
      if (Number.isFinite(numericViewCount)) {
        return numericViewCount;
      }

      return null;
    } catch (error) {
      console.error("게시글 조회수 증가 실패:", error);
      return null;
    }
  }, [postId]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const [loadedPost] = await Promise.all([
        fetchPostDetail(),
        fetchComments(),
      ]);
      const updatedViewCount = await increasePostView();

      if (cancelled) return;

      if (updatedViewCount != null) {
        setPost((prev) => {
          const basePost = prev || loadedPost;
          if (!basePost) return basePost;

          return {
            ...basePost,
            viewCount: updatedViewCount,
          };
        });
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [fetchPostDetail, fetchComments, increasePostView]);

  function increaseLocalCommentCount() {
    setPost((prev) => {
      if (!prev) return prev;

      const current = Number(prev.commentCount ?? 0);
      return {
        ...prev,
        commentCount: current + 1,
      };
    });
  }

  function decreaseLocalCommentCount() {
    setPost((prev) => {
      if (!prev) return prev;

      const current = Number(prev.commentCount ?? 0);
      return {
        ...prev,
        commentCount: Math.max(0, current - 1),
      };
    });
  }

  async function handleToggleLike() {
    if (processingLike || !postId) return;

    if (!canLike) {
      setCommentMsg({
        type: "error",
        text: "현재는 읽기 전용입니다. 이번 주 최종 참여자 또는 관리자만 좋아요를 사용할 수 있습니다.",
      });
      return;
    }

    setProcessingLike(true);

    try {
      const result = await toggleBoardPostLike(postId, boardIdentity);

      setPost((prev) => {
        if (!prev) return prev;

        const fallbackCurrent = Number(prev.likeCount ?? 0);
        const fallbackNext =
          result?.liked === false
            ? Math.max(0, fallbackCurrent - 1)
            : fallbackCurrent + 1;

        return {
          ...prev,
          likeCount:
            result?.likeCount ??
            result?.data?.likeCount ??
            result?.result?.likeCount ??
            fallbackNext,
        };
      });

      if (result?.message) {
        setCommentMsg({
          type: "success",
          text: result.message,
        });
      }
    } catch (error) {
      console.error("좋아요 토글 실패:", error);

      if (isPermissionDeniedError(error)) {
        await refreshCurrentBoardSession();
      }

      setCommentMsg({
        type: "error",
        text: extractApiErrorMessage(
          error,
          "좋아요 처리 중 오류가 발생했습니다."
        ),
      });
    } finally {
      setProcessingLike(false);
    }
  }

  async function handleSubmitComment() {
    if (!postId) {
      setCommentMsg({
        type: "error",
        text: "게시글 번호가 없어 댓글을 작성할 수 없습니다.",
      });
      return;
    }

    if (!canWriteComment) {
      setCommentMsg({
        type: "error",
        text: "현재는 읽기 전용입니다. 이번 주 최종 참여자 또는 관리자만 댓글을 작성할 수 있습니다.",
      });
      return;
    }

    if (!commentContent.trim()) {
      setCommentMsg({
        type: "error",
        text: "댓글 내용을 입력해 주세요.",
      });
      return;
    }

    setSubmittingComment(true);

    try {
      await createBoardComment(postId, {
        ...boardIdentity,
        content: commentContent.trim(),
        parentCommentId: null,
      });

      setCommentContent("");
      setCommentMsg({
        type: "success",
        text: "댓글이 등록되었습니다.",
      });

      increaseLocalCommentCount();
      await fetchComments();
    } catch (error) {
      console.error("댓글 작성 실패:", error);

      if (isPermissionDeniedError(error)) {
        await refreshCurrentBoardSession();
      }

      setCommentMsg({
        type: "error",
        text: extractApiErrorMessage(
          error,
          "댓글 등록 중 오류가 발생했습니다."
        ),
      });
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleSubmitReply(parentCommentId) {
    if (!postId) {
      setCommentMsg({
        type: "error",
        text: "게시글 번호가 없어 대댓글을 작성할 수 없습니다.",
      });
      return;
    }

    if (!canWriteComment) {
      setCommentMsg({
        type: "error",
        text: "현재는 읽기 전용입니다. 이번 주 최종 참여자 또는 관리자만 대댓글을 작성할 수 있습니다.",
      });
      return;
    }

    if (!replyContent.trim()) {
      setCommentMsg({
        type: "error",
        text: "대댓글 내용을 입력해 주세요.",
      });
      return;
    }

    setSubmittingComment(true);

    try {
      await createBoardComment(postId, {
        ...boardIdentity,
        content: replyContent.trim(),
        parentCommentId,
      });

      setReplyTargetId(null);
      setReplyContent("");
      setCommentMsg({
        type: "success",
        text: "대댓글이 등록되었습니다.",
      });

      increaseLocalCommentCount();
      await fetchComments();
    } catch (error) {
      console.error("대댓글 작성 실패:", error);

      if (isPermissionDeniedError(error)) {
        await refreshCurrentBoardSession();
      }

      setCommentMsg({
        type: "error",
        text: extractApiErrorMessage(
          error,
          "대댓글 등록 중 오류가 발생했습니다."
        ),
      });
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!postId) {
      setCommentMsg({
        type: "error",
        text: "게시글 번호가 없어 댓글을 삭제할 수 없습니다.",
      });
      return;
    }

    if (!hasBoardIdentity) {
      setCommentMsg({
        type: "error",
        text: "게시판 입장 정보가 없어 댓글을 삭제할 수 없습니다.",
      });
      return;
    }

    const ok = window.confirm("이 댓글을 삭제하시겠습니까?");
    if (!ok) return;

    setDeletingCommentId(commentId);

    try {
      await deleteBoardComment(commentId, boardIdentity);

      setCommentMsg({
        type: "success",
        text: "댓글이 삭제되었습니다.",
      });

      decreaseLocalCommentCount();
      await fetchComments();
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      setCommentMsg({
        type: "error",
        text: extractApiErrorMessage(
          error,
          "댓글 삭제 중 오류가 발생했습니다."
        ),
      });
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleDeletePost() {
    if (!isAdmin || !postId) return;

    if (!hasAdminToken) {
      setErrorMsg("관리자 토큰이 없습니다. 관리자 입장을 다시 진행해 주세요.");
      return;
    }

    const ok = window.confirm("이 게시글을 삭제하시겠습니까?");
    if (!ok) return;

    setProcessingDelete(true);

    try {
      await deleteBoardPostByAdmin(postId);
      window.alert("게시글이 삭제되었습니다.");
      navigate("/board");
    } catch (error) {
      console.error("게시글 삭제 실패:", error);

      const rawMessage = extractApiErrorMessage(
        error,
        "게시글 삭제 중 오류가 발생했습니다."
      );

      const normalizedMessage = String(rawMessage ?? "");
      const tokenError =
        normalizedMessage.includes("관리자 토큰") ||
        normalizedMessage.includes("Unauthorized") ||
        normalizedMessage.includes("401");

      setErrorMsg(
        tokenError
          ? "관리자 인증이 만료되었거나 토큰이 올바르지 않습니다. 관리자 입장을 다시 진행해 주세요."
          : normalizedMessage
      );
    } finally {
      setProcessingDelete(false);
    }
  }

  function renderCommentItem(item, depth = 0) {
    const isReply = depth > 0;

    return (
      <div
        key={item.commentId}
        className={`board-commentItem ${isReply ? "board-commentReply" : ""}`}
      >
        <div className="board-commentTop">
          <div className="board-commentWriterWrap">
            <span className="board-commentWriter">
              {item.writerDisplayName || "익명"}
            </span>
            <span className="board-commentRole">
              {normalizeRole(item.writerRole || "PARTICIPANT")}
            </span>
          </div>

          <span className="board-commentDate">
            {formatDateTime(item.createdAt)}
          </span>
        </div>

        <div className="board-commentContent">
          {item.content || "내용 없음"}
        </div>

        <div className="board-commentActions">
          {canWriteComment && (
            <button
              type="button"
              className="board-btn board-btnGhost board-btnInline"
              onClick={() => {
                setReplyTargetId(
                  replyTargetId === item.commentId ? null : item.commentId
                );
                setReplyContent("");
              }}
            >
              {replyTargetId === item.commentId ? "답글 취소" : "답글"}
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              className="board-btn board-btnGhost board-btnInline"
              onClick={() => handleDeleteComment(item.commentId)}
              disabled={deletingCommentId === item.commentId}
            >
              {deletingCommentId === item.commentId ? "삭제 중..." : "삭제"}
            </button>
          )}
        </div>

        {replyTargetId === item.commentId && canWriteComment && (
          <div className="board-replyForm">
            <textarea
              className="board-commentTextarea"
              placeholder="대댓글을 입력하세요"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={submittingComment}
            />
            <div className="board-replyActions">
              <button
                type="button"
                className="board-btn board-btnPrimary board-btnInlineWide"
                onClick={() => handleSubmitReply(item.commentId)}
                disabled={submittingComment}
              >
                {submittingComment ? "등록 중..." : "대댓글 등록"}
              </button>
            </div>
          </div>
        )}

        {Array.isArray(item.children) && item.children.length > 0 && (
          <div className="board-commentChildren">
            {item.children.map((child) => renderCommentItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="board-page">
      <div className="board-shell board-detailPage">
        <header className="board-headerCard">
          <p className="board-eyebrow">WOORILAND BOARD</p>
          <h1 className="board-title">게시글 상세</h1>
          <p className="board-subtitle">
            게시글 내용과 댓글을 확인하고, 권한에 따라 좋아요와 댓글 작성이
            가능합니다.
          </p>
        </header>

        {loadingPost ? (
          <section className="board-panel">
            <div className="board-emptyState">게시글을 불러오는 중입니다...</div>
          </section>
        ) : errorMsg ? (
          <section className="board-panel">
            <div className="board-message board-message-error">{errorMsg}</div>
          </section>
        ) : !post ? (
          <section className="board-panel">
            <div className="board-emptyState">게시글을 찾을 수 없습니다.</div>
          </section>
        ) : (
          <>
            <section className="board-panel">
              <div className="board-detailTop">
                <div className="board-detailBadges">
                  <span className="board-postCategory">
                    {getCategoryLabel(post.category)}
                  </span>

                  {isYes(post.isNotice) && (
                    <span className="board-postBadge board-postBadge-notice">
                      공지
                    </span>
                  )}

                  {isYes(post.isHot) && (
                    <span className="board-postBadge board-postBadge-hot">
                      HOT
                    </span>
                  )}
                </div>

                <div className="board-detailActions">
                  <button
                    type="button"
                    className="board-btn board-btnGhost"
                    onClick={() => navigate("/board")}
                  >
                    목록으로
                  </button>

                  {isAdmin && hasAdminToken && (
                    <>
                      <button
                        type="button"
                        className="board-btn board-btnPrimary"
                        onClick={() => navigate(`/board/admin/${postId}/edit`)}
                      >
                        수정
                      </button>

                      <button
                        type="button"
                        className="board-btn board-btnGhost"
                        onClick={handleDeletePost}
                        disabled={processingDelete}
                      >
                        {processingDelete ? "삭제 중..." : "삭제"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h2 className="board-detailTitle">{post.title || "제목 없음"}</h2>

              <div className="board-detailMeta">
                <span>
                  작성자 <strong>{post.writerDisplayName || "-"}</strong>
                </span>
                <span>
                  권한 <strong>{post.writerRole || "-"}</strong>
                </span>
                <span>
                  작성일 <strong>{formatDateTime(post.createdAt)}</strong>
                </span>
                <span>
                  수정일 <strong>{formatDateTime(post.updatedAt)}</strong>
                </span>
              </div>

              <div className="board-divider" />

              <div className="board-detailContent">
                {post.content || "내용이 없습니다."}
              </div>

              <div className="board-divider" />

              <div className="board-detailBottom">
                <div className="board-detailStats">
                  <span>
                    조회수 <strong>{formatCount(post.viewCount)}</strong>
                  </span>
                  <span>
                    좋아요 <strong>{formatCount(post.likeCount)}</strong>
                  </span>
                  <span>
                    댓글 <strong>{formatCount(post.commentCount)}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  className="board-btn board-btnSecondary"
                  onClick={handleToggleLike}
                  disabled={processingLike || !canLike}
                  title={
                    canLike
                      ? "좋아요"
                      : "이번 주 최종 참여자 또는 관리자만 좋아요를 사용할 수 있습니다."
                  }
                >
                  {processingLike ? "처리 중..." : "좋아요"}
                </button>
              </div>
            </section>

            <section className="board-panel">
              <div className="board-panelHeader">
                <h2>댓글 작성</h2>
                <p>
                  {canWriteComment
                    ? "이번 주 최종 참여자 또는 관리자 권한으로 댓글을 남길 수 있습니다."
                    : "현재는 읽기 전용입니다. 이번 주 최종 참여자로 확인되면 댓글 작성이 가능합니다."}
                </p>
              </div>

              <div className={`board-message board-message-${commentMsg.type}`}>
                {commentMsg.text}
              </div>

              <div className="board-commentForm">
                <textarea
                  className="board-commentTextarea"
                  placeholder={
                    canWriteComment
                      ? "댓글을 입력하세요"
                      : "현재는 읽기 전용입니다. 이번 주 최종 참여자로 확인되면 댓글을 작성할 수 있습니다."
                  }
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  disabled={!canWriteComment || submittingComment}
                />

                <div className="board-commentFormActions">
                  <button
                    type="button"
                    className="board-btn board-btnPrimary"
                    onClick={handleSubmitComment}
                    disabled={!canWriteComment || submittingComment}
                  >
                    {submittingComment ? "등록 중..." : "댓글 등록"}
                  </button>
                </div>
              </div>
            </section>

            <section className="board-panel">
              <div className="board-panelHeader">
                <h2>댓글 목록</h2>
                <p>대댓글은 들여쓰기로 구분됩니다.</p>
              </div>

              {loadingComments ? (
                <div className="board-emptyState">댓글을 불러오는 중입니다...</div>
              ) : comments.length === 0 ? (
                <div className="board-emptyState">아직 등록된 댓글이 없습니다.</div>
              ) : (
                <div className="board-commentList">
                  {comments.map((item) => renderCommentItem(item))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
