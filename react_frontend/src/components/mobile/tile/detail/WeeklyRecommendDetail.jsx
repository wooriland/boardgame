// ✅ 파일: src/components/mobile/tile/detail/WeeklyRecommendDetail.jsx

import { useEffect, useMemo, useState } from "react";
import { getWeeklyRecommend } from "../../../../api/recommendApi";
import "./tileDetails.css";

function pickWeekStartDate(props) {
  if (props?.weekStartDate) return props.weekStartDate;
  if (props?.ctx?.weekStartDate) return props.ctx.weekStartDate;
  return "";
}

function normalizeText(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function getFallbackView(weekStartDate = "") {
  return {
    weekStartDate: normalizeDate(weekStartDate),
    items: [
      {
        level: "EASY",
        name: "추천 게임 정보 없음",
        description: "설명이 아직 등록되지 않았습니다.",
      },
      {
        level: "NORMAL",
        name: "추천 게임 정보 없음",
        description: "설명이 아직 등록되지 않았습니다.",
      },
      {
        level: "HARD",
        name: "추천 게임 정보 없음",
        description: "설명이 아직 등록되지 않았습니다.",
      },
    ],
  };
}

function normalizeRecommendResponse(data) {
  const src = data && typeof data === "object" ? data : {};

  return {
    weekStartDate: normalizeDate(
      src.weekStartDate ?? src.recommendWeekStartDate ?? src.date ?? ""
    ),
    items: [
      {
        level: "EASY",
        name: normalizeText(
          src.easyGameName ??
            src.easyName ??
            src.easy?.gameName ??
            src.easy?.name,
          "추천 게임 정보 없음"
        ),
        description: normalizeText(
          src.easyDescription ??
            src.easySummary ??
            src.easyDesc ??
            src.easy?.description ??
            src.easy?.summary ??
            src.easy?.desc,
          "설명이 아직 등록되지 않았습니다."
        ),
      },
      {
        level: "NORMAL",
        name: normalizeText(
          src.normalGameName ??
            src.normalName ??
            src.normal?.gameName ??
            src.normal?.name,
          "추천 게임 정보 없음"
        ),
        description: normalizeText(
          src.normalDescription ??
            src.normalSummary ??
            src.normalDesc ??
            src.normal?.description ??
            src.normal?.summary ??
            src.normal?.desc,
          "설명이 아직 등록되지 않았습니다."
        ),
      },
      {
        level: "HARD",
        name: normalizeText(
          src.hardGameName ??
            src.hardName ??
            src.hard?.gameName ??
            src.hard?.name,
          "추천 게임 정보 없음"
        ),
        description: normalizeText(
          src.hardDescription ??
            src.hardSummary ??
            src.hardDesc ??
            src.hard?.description ??
            src.hard?.summary ??
            src.hard?.desc,
          "설명이 아직 등록되지 않았습니다."
        ),
      },
    ],
  };
}

function DifficultyCard({ level, name, description }) {
  return (
    <section className="td-card">
      <div className="td-kicker">{level}</div>
      <div className="td-cardTitle">{name}</div>
      <div className="td-cardText">{description}</div>
    </section>
  );
}

export default function WeeklyRecommendDetail(props) {
  const weekStartDate = pickWeekStartDate(props);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommend, setRecommend] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const data = await getWeeklyRecommend(weekStartDate);
        if (cancelled) return;

        setRecommend(normalizeRecommendResponse(data));
      } catch (err) {
        if (cancelled) return;

        const errorMessage =
          err instanceof Error && err.message
            ? `금주의 추천 정보를 불러오지 못했습니다.\n${err.message}`
            : "금주의 추천 정보를 불러오지 못했습니다.";

        setError(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [weekStartDate]);

  const view = useMemo(() => {
    return recommend || getFallbackView(weekStartDate);
  }, [recommend, weekStartDate]);

  return (
    <div className="td-wrap">
      <section className="td-hero">
        <div className="td-heroRow">
          <div className="td-heroMain">
            <h2 className="td-title">금주의 추천</h2>
            <p className="td-subtitle">
              한 주 동안 쉽게 고를 수 있도록 난이도별 추천 게임을 정리했어요.
            </p>
          </div>

          <div className="td-date">{view.weekStartDate || "-"}</div>
        </div>

        <div className="td-chipRow">
          <span className="td-chip">EASY</span>
          <span className="td-chip">NORMAL</span>
          <span className="td-chip">HARD</span>
        </div>
      </section>

      {loading ? (
        <section className="td-message">
          금주의 추천 정보를 불러오는 중입니다...
        </section>
      ) : null}

      {!loading && error ? (
        <section className="td-message">{error}</section>
      ) : null}

      {!loading &&
        view.items.map((item) => (
          <DifficultyCard
            key={item.level}
            level={item.level}
            name={item.name}
            description={item.description}
          />
        ))}
    </div>
  );
}