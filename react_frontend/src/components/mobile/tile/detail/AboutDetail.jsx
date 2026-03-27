import { useLocation, useNavigate } from "react-router-dom";
import "./tileDetails.css";

export default function AboutDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  const goJoinGuide = () => {
    navigate("/m/tile/join-guide", { state: location.state });
  };

  return (
    <div className="td-wrap">
      <section className="td-hero">
        <div className="td-heroMain">
          <h2 className="td-title">운영 안내</h2>
          <p className="td-subtitle">
            우리랜드는 코인노래방 같은 가벼운 모임이 아닙니다.
            <br />
            그리고 보드게임 동아리입니다.
            <br />
            청년부 구성원이라면 누구나 참여할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="td-card">
        <div className="td-kicker">HOW WE RUN</div>
        <div className="td-cardTitle">운영 방식</div>
        <ul className="td-bullets">
          <li>주간 추천 게임을 기준으로 운영합니다.</li>
          <li>매주 주중부터 참여 요청을 받습니다.</li>
          <li>각 게임마다 참여할 수 있는 인원에 제한이 있습니다.</li>
          <li>매주 토요일 20시 참여 인원을 집계해 공지합니다.</li>
          <li>각 청년부 1명 이상 참여할 수 있도록 준비했습니다.</li>
          <li>초보자도 쉽게 참여할 수 있도록 단계별로 안내합니다.</li>
        </ul>
      </section>

      <section className="td-card">
        <div className="td-kicker">GUIDE</div>
        <div className="td-cardTitle">참여 흐름과 기준</div>
        <div className="td-cardText">
          추천 확인 → 요청 → 선정 결과 확인 → 현장 참여
          <br />
          흐름으로 이해하면 가장 쉽습니다.
          <br />
        </div>
      </section>

      <section className="td-cta">
        <button className="td-ctaBtn" onClick={goJoinGuide}>
          참여 안내 보러가기 →
        </button>
      </section>
    </div>
  );
}
