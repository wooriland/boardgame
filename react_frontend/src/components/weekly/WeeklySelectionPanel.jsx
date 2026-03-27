// ✅ 파일: src/components/weekly/WeeklySelectionPanel.jsx
import { useMemo } from "react";

import Header from "../sections/Header";
import Hero from "../sections/Hero";
import About from "../sections/About";
import CTA from "../sections/CTA";
import FooterInfo from "../sections/FooterInfo";

import WeeklySelectedPanel from "./WeeklySelectedPanel";
import WeeklySelectionStatsPanel from "./WeeklySelectionStatsPanel";
import WeeklyRecommendPanel from "./WeeklyRecommendPanel";

import DeptStatsPanel from "../sections/DeptStatsPanel";

// ✅ 카카오 고정 지도
import KakaoFixedMap from "../KakaoFixedMap";

// ✅ 공용 게시판 카드
import BoardCard from "../cards/BoardCard";

// ✅ (중요) weekStartDate는 공용 유틸로 통일
import { toWeekStartDateYYYYMMDD } from "../../utils/dateUtils";

/**
 * ✅ WeeklySelectionPanel
 * - "주간 추천/신청" 화면을 패널(또는 별도 페이지)로 구성할 때 쓰는 조합형 컴포넌트
 *
 * Props:
 * - onOpenJoin: 참여 신청 모달 오픈
 * - onOpenWeekly: 금주의 추천 모달 오픈
 *
 * 핵심 원칙:
 * - 선정 명단 카드와 선정 통계 카드는 반드시 같은 주차(weekStartDate)를 본다.
 * - 명단 카드는 EASY/NORMAL/HARD별 참가자 목록을 보여주는 역할
 * - 통계 카드는 백엔드가 계산한 overallByDept / overallTotal을 보여주는 역할
 * - 서로 데이터를 다시 계산하거나 섞지 않고 책임을 분리한다.
 */
export default function WeeklySelectionPanel({ onOpenJoin, onOpenWeekly }) {
  // ✅ 일요일 기준 weekStartDate (YYYY-MM-DD)
  const weekStartDate = useMemo(
    () => toWeekStartDateYYYYMMDD(new Date()),
    []
  );

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
              ✅ 주의:
              - 1번과 2번은 같은 weekStartDate를 공유한다.
              - 1번은 명단 전용 카드
              - 2번은 통계 전용 카드
              - 통계는 명단 데이터를 다시 세지 않고 별도 API 결과를 사용한다.
              ===================================================== */}
          <aside className="side-panel glass" aria-label="left-side-panel">
            <div className="side-split" style={{ padding: 18 }}>
              {/* 1) 이번 주 참여자 명단 */}
              <div className="inner-card">
                <div className="inner-scroll">
                  <WeeklySelectedPanel weekStartDate={weekStartDate} />
                </div>
              </div>

              {/* 2) 부서별 선정 통계 */}
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
                      우리랜드는 3청년부 보드게임 동아리 입니다.
                      <br />
                      중앙동아리의 지원으로
                      <br />
                      모든 청년교구에서 참여할 수 있습니다.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="section-space" aria-label="cta-section">
              <div className="content-max">
                <div className="glass" style={{ padding: 22 }}>
                  <CTA onClick={onOpenJoin} />
                </div>
              </div>
            </section>
          </div>

          {/* =====================================================
              ✅ RIGHT SIDE (3분할)
              1) 금주의 추천
              2) 게시판 카드
              3) 오시는 길
              ===================================================== */}
          <aside className="side-panel glass" aria-label="right-side-panel">
            <div className="side-split" style={{ padding: 18 }}>
              {/* 1) 금주의 추천 */}
              <div className="inner-card">
                <div className="inner-scroll">
                  <WeeklyRecommendPanel
                    weekStartDate={weekStartDate}
                    onOpenWeeklyModal={onOpenWeekly}
                  />
                </div>
              </div>

              {/* 2) 공용 게시판 카드 */}
              <div className="inner-card">
                <div className="inner-scroll">
                  <BoardCard
                    title="우리랜드 공지/후기 게시판"
                    description={
                      <>
                        운영 공지와 참여 후기를 확인해보세요.
                        <br />
                        이번 주 안내와 이전 활동 기록도 함께 볼 수 있습니다.
                      </>
                    }
                    buttonText="게시판 바로가기"
                    to="/board"
                  />
                </div>
              </div>

              {/* 3) 카카오 고정 지도 */}
              <div className="inner-card">
                <div className="inner-scroll no-scroll">
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>
                    오시는 길
                  </div>

                  <div
                    className="muted"
                    style={{ lineHeight: 1.6, marginBottom: 12 }}
                  >
                    모임 장소: 분당우리교회 드림센터
                    <br />
                    (황새울로311번길 9 / 서현동 276-2)
                  </div>

                  <KakaoFixedMap height={220} />

                  <div
                    className="muted"
                    style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5 }}
                  >
                    지도가 보이지 않으면: 카카오 Developers의 <b>JS SDK 도메인</b>에{" "}
                    <b>http://localhost:5173</b>가 등록되어 있는지 확인해 주세요.
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