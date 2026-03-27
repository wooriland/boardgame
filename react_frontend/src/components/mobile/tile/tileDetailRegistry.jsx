// ✅ 파일: src/components/mobile/tile/tileDetailRegistry.jsx

import WeeklyRecommendDetail from "./detail/WeeklyRecommendDetail";
import WeeklySelectedDetail from "./detail/WeeklySelectedDetail";
import WeeklySelectionStatsDetail from "./detail/WeeklySelectionStatsDetail";
import DeptStatsDetail from "./detail/DeptStatsDetail";
import MapDetail from "./detail/MapDetail";
import JoinGuideDetail from "./detail/JoinGuideDetail";
import BoardEntryDetail from "./detail/BoardEntryDetail";
import AboutDetail from "./detail/AboutDetail";
import NoticeDetail from "./detail/NoticeDetail";
import ContactDetail from "./detail/ContactDetail";

function renderPlaceholderDetail({
  title = "준비 중",
  description = "이 상세 화면은 다음 단계에서 구현할 예정입니다.",
} = {}) {
  return (
    <div className="td-wrap">
      <section className="td-card">
        <div className="td-kicker">DETAIL</div>
        <div className="td-cardTitle">{title}</div>
        <div className="td-cardText">{description}</div>
      </section>
    </div>
  );
}

/**
 * ✅ 모바일 상세 레지스트리
 * - mobileCards.js 의 detailComponent 키와 1:1로 맞춘다.
 * - 각 상세 화면은 자기 역할만 보여준다.
 *   - WeeklyRecommendDetail: 추천 상세
 *   - WeeklySelectedDetail: 명단 상세
 *   - WeeklySelectionStatsDetail: 선정 통계 상세
 *   - DeptStatsDetail: 신청 현황 상세
 * - 여기서는 "연결"만 담당하고, 데이터 계산은 각 상세 컴포넌트가 책임진다.
 */
export function renderTileDetailByKey(detailKey, props = {}) {
  switch (detailKey) {
    case "WeeklyRecommendDetail":
      return <WeeklyRecommendDetail {...props} />;

    case "WeeklySelectedDetail":
      return <WeeklySelectedDetail {...props} />;

    case "WeeklySelectionStatsDetail":
      return <WeeklySelectionStatsDetail {...props} />;

    case "DeptStatsDetail":
      return <DeptStatsDetail {...props} />;

    case "MapDetail":
      return <MapDetail {...props} />;

    case "JoinGuideDetail":
      return <JoinGuideDetail {...props} />;

    case "BoardEntryDetail":
      return <BoardEntryDetail {...props} />;

    case "AboutDetail":
      return <AboutDetail {...props} />;

    case "NoticeDetail":
      return <NoticeDetail {...props} />;

    case "ContactDetail":
      return <ContactDetail {...props} />;

    default:
      return renderPlaceholderDetail({
        title: "상세 정보 없음",
        description: "연결된 상세 화면을 찾을 수 없습니다.",
      });
  }
}