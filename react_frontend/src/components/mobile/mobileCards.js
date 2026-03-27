function safeCtx(ctx) {
  return ctx && typeof ctx === "object" ? ctx : {};
}

export const MOBILE_PAGES = Object.freeze([
  {
    id: "page-core",
    title: "핵심 안내",
    tiles: [
      {
        id: "ai-guide",
        title: "AI 게임 안내",
        summary:
          "게임명을 검색해\n세계관과 기본 룰을\n빠르게 확인해보세요.",
        tone: "accent",
        className: "m-tile--span-2",
        previewComponent: null,
        detailComponent: null,
        previewProps: {},
      },
      {
        id: "weekly-reco",
        title: "이번 주 추천",
        summary:
          "이번 주 추천 게임을\nEASY / NORMAL / HARD로\n빠르게 확인해보세요.",
        tone: "accent",
        previewComponent: "WeeklyRecommendPanel",
        detailComponent: "WeeklyRecommendDetail",
        previewProps: (ctx) => {
          const c = safeCtx(ctx);
          return {
            weekStartDate: c.weekStartDate ?? "",
            onOpenWeeklyModal: c.onOpenWeekly ?? null,
            onOpenWeekly: c.onOpenWeekly ?? null,
          };
        },
      },
      {
        id: "participants",
        title: "이번 주 참여자",
        summary:
          "확정된 참여 명단을\nEASY / NORMAL / HARD별로\n확인할 수 있어요.",
        previewComponent: "WeeklySelectedPanel",
        detailComponent: "WeeklySelectedDetail",
        previewProps: (ctx) => {
          const c = safeCtx(ctx);
          return {
            weekStartDate: c.weekStartDate ?? "",
          };
        },
      },
      {
        id: "dept-selected-stats",
        title: "부서별 선정 통계",
        summary:
          "부서별 확정 인원을\n한눈에 확인할 수 있어요.\n중복 선정은 1명으로 집계합니다.",
        previewComponent: "WeeklySelectionStatsPanel",
        detailComponent: "WeeklySelectionStatsDetail",
        previewProps: (ctx) => {
          const c = safeCtx(ctx);
          return {
            weekStartDate: c.weekStartDate ?? "",
          };
        },
      },
      {
        id: "dept-apply",
        title: "부서별 신청 현황",
        summary:
          "부서별 신청 인원을\n빠르게 확인해보세요.\n선정 통계와는 별도 기준입니다.",
        previewComponent: "DeptStatsPanel",
        detailComponent: "DeptStatsDetail",
        previewProps: (ctx) => {
          const c = safeCtx(ctx);
          return {
            weekStartDate: c.weekStartDate ?? "",
          };
        },
      },
    ],
  },
  {
    id: "page-location",
    title: "오프라인 / 참여",
    tiles: [
      {
        id: "map",
        title: "모임 장소",
        summary:
          "분당우리교회\n드림센터 1011호\n위치와 이동 안내를\n빠르게 확인해보세요.",
        tone: "muted",
        previewComponent: "KakaoFixedMap",
        detailComponent: "MapDetail",
        previewProps: {
          height: 160,
        },
      },
      {
        id: "join-guide",
        title: "참여 안내",
        summary:
          "주간 추천을 확인한 뒤\n참여 신청을 진행해요.\n매주 주일 기준으로\n안내가 열립니다.",
        previewComponent: null,
        detailComponent: "JoinGuideDetail",
        previewProps: {},
      },
      {
        id: "board",
        title: "게시판",
        summary:
          "공지 / 운영 안내 /\n참여 후기를 한 번에\n확인해보세요.",
        tone: "accent",
        previewComponent: null,
        detailComponent: "BoardEntryDetail",
        previewProps: {},
      },
    ],
  },
  {
    id: "page-community",
    title: "운영 / 커뮤니티",
    tiles: [
      {
        id: "about",
        title: "운영 안내",
        summary:
          "우리랜드 운영 방식과\n참여 흐름,\n선정 기준을 안내합니다.",
        previewComponent: null,
        detailComponent: "AboutDetail",
        previewProps: {},
      },
      {
        id: "notice",
        title: "공지",
        summary:
          "참여 조건과\n운영 안내,\n주간 일정을 확인하세요.",
        previewComponent: null,
        detailComponent: "NoticeDetail",
        previewProps: {},
      },
      {
        id: "contact",
        title: "문의",
        summary:
          "동아리장 연락처와\n담당 부서를\n빠르게 확인해보세요.",
        previewComponent: null,
        detailComponent: "ContactDetail",
        previewProps: {},
      },
    ],
  },
]);

export const MOBILE_CARDS = MOBILE_PAGES;

