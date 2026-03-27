// ✅ 파일: src/pages/Home.jsx
import Header from "../components/sections/Header";
import Hero from "../components/sections/Hero";
import About from "../components/sections/About";
import AiGuideEntryCard from "../components/ai/AiGuideEntryCard";
import FooterInfo from "../components/sections/FooterInfo";

// ✅ LEFT 1: 이번 주 참여자(상세 명단만)
import WeeklySelectedPanel from "../components/weekly/WeeklySelectedPanel";
// ✅ LEFT 2: 부서별 선정 인원(백엔드 최종 통계)
import WeeklySelectionStatsPanel from "../components/weekly/WeeklySelectionStatsPanel";

import WeeklyRecommendPanel from "../components/weekly/WeeklyRecommendPanel";
import DeptStatsPanel from "../components/sections/DeptStatsPanel";

// ✅ 카카오 고정 지도
import KakaoFixedMap from "../components/KakaoFixedMap";

// ✅ 공용 게시판 카드
import BoardCard from "../components/cards/BoardCard";

import { toWeekStartDateYYYYMMDD } from "../utils/dateUtils";

/**
 * ✅ HomeDesktop: 기존 완성본(데스크탑 홈)
 * - "/"는 항상 이 화면만 렌더한다.
 * - 모바일 전용 홈은 "/m" 라우트가 담당한다.
 *
 * 핵심 원칙:
 * - 주간 관련 카드들은 모두 같은 weekStartDate를 공유한다.
 * - 참여자 명단 카드: EASY/NORMAL/HARD별 명단 표시
 * - 선정 통계 카드: overallByDept / overallTotal 표시
 * - 신청 현황 카드: 신청 기준 부서별 인원 표시
 * - 추천 카드: 주간 추천 정보 표시
 *
 * 수정 포인트:
 * - 게시판 진입 카드를 "/board"가 아니라 "/board/enter"로 연결
 * - 홈에서 게시판으로 이어지는 명확한 입장 경로 제공
 */
function HomeDesktop({ onOpenJoin, onOpenWeekly, onOpenAiGuide }) {
  // ✅ 일요일 기준 weekStartDate (YYYY-MM-DD)
  // 모든 주간 카드가 이 값을 공통 기준으로 공유한다.
  const weekStartDate = toWeekStartDateYYYYMMDD(new Date()) || "";

  return (
    <>
      <Header onCtaClick={onOpenJoin} />

      <div className="container">
        <div className="page-shell">
          {/* =====================================================
              ✅ LEFT SIDE (3분할)
              1) 이번 주 참여자 명단
              2) 부서별 선정 통계
              3) 부서별 신청 현황
              -----------------------------------------------------
              세 카드는 같은 주차를 보되, 서로 다른 역할만 담당한다.
              ===================================================== */}
          <aside className="side-panel glass" aria-label="left-side-panel">
            <div className="side-split" style={{ padding: 18 }}>
              {/* 1) 이번 주 참여자(상세 명단만) */}
              <div className="inner-card">
                <div className="inner-scroll">
                  <WeeklySelectedPanel weekStartDate={weekStartDate} />
                </div>
              </div>

              {/* 2) 부서별 선정 통계(백엔드 최종 통계) */}
              <div className="inner-card">
                <div className="inner-scroll">
                  <WeeklySelectionStatsPanel weekStartDate={weekStartDate} />
                </div>
              </div>

              {/* 3) 부서별 신청 현황 */}
              <div className="inner-card">
                <div className="inner-scroll">
                  <DeptStatsPanel weekStartDate={weekStartDate} />
                </div>
              </div>
            </div>
          </aside>

          {/* =====================================================
              ✅ CENTER
              ===================================================== */}
          <div className="center-area">
            <section className="section-space" aria-label="hero-section">
              <div className="content-max">
                <div className="glass" style={{ padding: 22 }}>
                  <Hero
                    onPrimaryClick={onOpenJoin}
                    onSecondaryClick={null}
                    rightSlot={null}
                  />
                </div>
              </div>
            </section>

            <section className="section-space" aria-label="about-section">
              <div className="content-max">
                <div className="glass" style={{ padding: 22 }}>
                  <About />
                </div>
              </div>
            </section>

            <section className="section-space" aria-label="preview-section">
              <div className="content-max">
                <div className="two-col">
                  <div className="glass" style={{ padding: 22 }}>
                    <h2 className="h2">공지</h2>
                    <div className="muted" style={{ lineHeight: 1.6 }}>
                      우리랜드는 보드게임 중앙동아리 입니다.
                      <br />
                      중앙동아리의 지원으로
                      <br />
                      모든 청년교구에서 참여할 수 있습니다.
                    </div>
                  </div>

                  <div className="glass" style={{ padding: 22 }}>
                    <h2 className="h2">문의</h2>
                    <div className="muted" style={{ lineHeight: 1.6 }}>
                      동아리장: 권혁철(010.9250.8070)
                      <br />
                      소속: 2026년 기준 3청년부
                      <br />
                      처음 참여가 어렵다면 연락 주세요.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="section-space" aria-label="cta-section">
              <div className="content-max">
                <div className="glass" style={{ padding: 22 }}>
                  <AiGuideEntryCard onClick={onOpenAiGuide} />
                </div>
              </div>
            </section>
          </div>

          {/* =====================================================
              ✅ RIGHT SIDE (3분할)
              1) 금주의 추천
              2) 게시판 진입
              3) 오시는 길
              -----------------------------------------------------
              추천 카드도 같은 weekStartDate를 표시 기준으로 공유한다.
              ===================================================== */}
          <aside className="side-panel glass" aria-label="right-side-panel">
            <div className="side-split" style={{ padding: 18 }}>
              {/* 1) 금주의 추천 */}
              <div className="inner-card">
                <div className="inner-scroll">
                  <WeeklyRecommendPanel weekStartDate={weekStartDate} />

                  {onOpenWeekly ? (
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={onOpenWeekly}
                      style={{ marginTop: 12 }}
                    >
                      금주의 추천 자세히 보기
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 2) 공용 게시판 카드 */}
              <div className="inner-card">
                <div className="inner-scroll">
                  <BoardCard
                    title="우리랜드 게시판"
                    description={
                      <>
                        참여 후기 / 공지 / 운영 안내를 확인해보세요.
                        <br />
                        읽기 전용 입장도 가능하고,
                        <br />
                        참여자는 댓글로 소통할 수 있습니다.
                      </>
                    }
                    buttonText="게시판 입장하기"
                    to="/board/enter"
                  />
                </div>
              </div>

              {/* 3) 오시는 길 */}
              <div className="inner-card">
                <div className="inner-scroll no-scroll">
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>
                    오시는 길
                  </div>

                  <div
                    className="muted"
                    style={{ lineHeight: 1.6, marginBottom: 12 }}
                  >
                    모임 장소: 분당우리교회 드림센터 1011호
                  </div>

                  <div className="kakao-map-container">
                    <KakaoFixedMap height={400} />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <section className="section-space" aria-label="footer-section">
        <div className="container">
          <div className="footer-max">
            <div className="glass" style={{ padding: 22 }}>
              <FooterInfo />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Home({ onOpenJoin, onOpenWeekly, onOpenAiGuide }) {
  return (
    <HomeDesktop
      onOpenJoin={onOpenJoin}
      onOpenWeekly={onOpenWeekly}
      onOpenAiGuide={onOpenAiGuide}
    />
  );
}
