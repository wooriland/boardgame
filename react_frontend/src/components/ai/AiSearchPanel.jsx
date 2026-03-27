export default function AiSearchPanel({
  query,
  onQueryChange,
  onSearch,
  isLoading,
}) {
  return (
    <section className="ai-guide-panel ai-guide-panel--search">
      <div className="ai-guide-sectionHead">
        <div>
          <div className="ai-guide-sectionTitle">게임 검색</div>
          <p className="ai-guide-sectionText">
            궁금한 게임명을 검색하면 AI가 세계관과 기본 룰을 안내해드립니다
          </p>
        </div>
      </div>

      <form
        className="ai-guide-searchForm"
        onSubmit={(event) => onSearch(event, "form-submit")}
      >
        <label className="ai-guide-searchLabel" htmlFor="ai-guide-search">
          게임명 입력
        </label>

        <div className="ai-guide-searchRow">
          <input
            id="ai-guide-search"
            className="ai-guide-searchInput"
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="예: 디아스, 쿠키런 킹덤, 인더스트리아"
            autoComplete="off"
          />

          <button
            className="ai-guide-searchButton"
            type="button"
            disabled={isLoading}
            onClick={(event) => onSearch(event, "search-button-click")}
          >
            {isLoading ? "안내 중..." : "검색"}
          </button>
        </div>
      </form>
    </section>
  );
}
