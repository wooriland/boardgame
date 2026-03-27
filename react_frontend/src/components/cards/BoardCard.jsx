// ✅ 파일: src/components/cards/BoardCard.jsx
import { useNavigate } from "react-router-dom";

/**
 * ✅ BoardCard
 * - 홈 화면 / 우측 패널 / 기타 진입 영역에서 사용하는 "게시판 입장 카드"
 *
 * 역할
 * - 게시판 소개
 * - 읽기 전용 입장 가능 안내
 * - 참여자 댓글 가능 안내
 * - 클릭 시 /board/enter 이동
 *
 * Props
 * - title?: 카드 제목
 * - description?: 카드 설명 문자열 또는 JSX
 * - buttonText?: 버튼 문구
 * - to?: 이동 경로 (기본: /board/enter)
 */
export default function BoardCard({
  title = "우리랜드 게시판",
  description = (
    <>
      참여 후기 / 공지 / 운영 안내를 확인해보세요.
      <br />
      읽기 전용으로도 입장할 수 있고,
      <br />
      참여자는 댓글로 소통할 수 있습니다.
    </>
  ),
  buttonText = "게시판 입장하기",
  to = "/board/enter",
}) {
  const navigate = useNavigate();

  function handleMoveBoard() {
    navigate(to);
  }

  return (
    <div className="board-entry-card">
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>

      <div className="muted" style={{ lineHeight: 1.6 }}>
        {description}
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(226, 232, 240, 0.88)",
          }}
        >
          • 읽기 전용 입장 가능
          <br />
          • 참여자는 댓글 작성 가능
          <br />
          • 관리자 권한은 별도 입장 방식 사용
        </div>

        <button
          className="btn ghost"
          type="button"
          onClick={handleMoveBoard}
          style={{ marginTop: 4 }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}