// ✅ 파일: src/components/FooterNav.jsx

/**
 * ✅ 하단 고정 메뉴 (모바일 퀵 액션)
 * - Intro / Weekly / Join을 "mode"로 올려서 부모(App)가 모달을 열게 한다.
 * - ✅ PC/큰 화면에서는 global.css에서 숨김 처리(중복 제거)
 */
export default function FooterNav({ onOpen }) {
  return (
    <footer className="footer-nav" aria-label="하단 메뉴">
      <button type="button" className="footer-btn" onClick={() => onOpen("intro")}>
        동아리 소개
      </button>

      <button type="button" className="footer-btn" onClick={() => onOpen("weekly")}>
        금주의 보드게임
      </button>

      <button type="button" className="footer-btn primary" onClick={() => onOpen("join")}>
        참여신청
      </button>
    </footer>
  );
}