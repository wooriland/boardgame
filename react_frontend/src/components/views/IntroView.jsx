// ✅ 파일: src/components/views/IntroView.jsx

export default function IntroView({ onClose }) {
  return (
    <section>
      <p className="modal-text">
        우리랜드는 3청에서 시작한 보드게임 동아리 입니다.<br />
        지금은 중앙동아리의 지원으로 모든 청년이 참여할 수 있습니다.
      </p>

      <p className="modal-text">
        우리랜드는 함께 모여 보드게임을 즐기며<br />
        친목을 다지는 모임입니다.<br />
        초보자도 쉽게 참여할 수 있도록 룰 설명과 진행을 도와드립니다.
      </p>

      <ul className="modal-list">
        <li>정기 모임: 매주 토요일 13:00</li>
        <li>장소: 드림센터 1011호</li>
        <li>대상: 누구나</li>
      </ul>

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>
          확인
        </button>
      </div>
    </section>
  );
}