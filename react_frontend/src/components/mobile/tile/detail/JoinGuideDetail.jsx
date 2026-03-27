// ✅ 파일: src/components/mobile/tile/detail/JoinGuideDetail.jsx

import "./tileDetails.css";

export default function JoinGuideDetail({ onOpenJoin }) {
  const handleOpenJoin = () => {
    if (typeof onOpenJoin === "function") {
      onOpenJoin();
      return;
    }

    // ✅ fallback
    alert("참여 신청 기능이 아직 연결되지 않았습니다.");
  };

  return (
    <div className="td-wrap">
      <section className="td-hero">
        <div className="td-heroMain">
          <h2 className="td-title">참여 안내</h2>
          <p className="td-subtitle">
            처음 오는 사람도 자연스럽게 참여할 수 있도록 흐름을 정리했어요.
          </p>
        </div>
      </section>

      <section className="td-card">
        <div className="td-kicker">FLOW</div>
        <div className="td-cardTitle">참여 방법</div>
        <ul className="td-bullets">
          <li>금주의 추천 게임을 먼저 확인합니다.</li>
          <li>참여 가능한 주차인지 확인한 뒤 신청합니다.</li>
          <li>선정 결과 공개 시간을 확인합니다.</li>
          <li>참여자가 아니어도 함께 어울리러 올 수 있습니다.</li>
        </ul>
      </section>

      <section className="td-card">
        <div className="td-kicker">WEEKLY RULE</div>
        <div className="td-cardTitle">운영 기준</div>
        <div className="td-cardText">
          매주 주일을 기준으로 새롭게 참여 신청이 열리고,
          <br />
          주간 추천과 선정 결과도 해당 주차 기준으로 운영됩니다.
        </div>
      </section>

      <section className="td-cta">
        <button
          type="button"
          className="td-ctaBtn"
          onClick={handleOpenJoin}
          aria-label="참여 신청 열기"
        >
          참여 신청
        </button>
      </section>
    </div>
  );
}