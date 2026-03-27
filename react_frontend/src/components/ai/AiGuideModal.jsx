import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { postAiChat } from "../../api/aiChatApi";
import { getApiErrorMessage } from "../../api/apiClient";
import {
  AI_GUIDE_GAMES,
  AI_WEEKLY_GAME_IDS,
  findAiGuideGameById,
} from "../../data/aiGuideGames";
import AiChatPanel from "./AiChatPanel";
import AiGameDetailPanel from "./AiGameDetailPanel";
import AiSearchPanel from "./AiSearchPanel";
import AiWeeklyGameList from "./AiWeeklyGameList";
import "./aiGuide.css";

function normalizeKeyword(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function buildSearchIndex(game) {
  return [
    game.name,
    game.tagline,
    game.shortDescription,
    String(game.gameId ?? ""),
    ...(Array.isArray(game.aliases) ? game.aliases : []),
  ]
    .map(normalizeKeyword)
    .filter(Boolean);
}

export default function AiGuideModal() {
  const weeklyGames = useMemo(
    () =>
      AI_WEEKLY_GAME_IDS.map((gameId) => findAiGuideGameById(gameId)).filter(
        Boolean
      ),
    []
  );
  const searchableGames = useMemo(
    () =>
      AI_GUIDE_GAMES.map((game) => ({
        ...game,
        searchIndex: buildSearchIndex(game),
      })),
    []
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [chatDrafts, setChatDrafts] = useState({});
  const [chatSessions, setChatSessions] = useState({});
  const searchTimerRef = useRef(null);

  const selectedGame = useMemo(
    () => findAiGuideGameById(selectedGameId),
    [selectedGameId]
  );
  const currentDraft = selectedGame ? chatDrafts[selectedGame.id] ?? "" : "";
  const currentSession = selectedGame
    ? chatSessions[selectedGame.id] ?? { messages: [], isLoading: false }
    : { messages: [], isLoading: false };

  useEffect(() => {
    return () => {
      window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    console.log("[AiGuideModal] selectedGame changed", {
      selectedGameId,
      selectedGame,
      status,
      selectedSource,
    });
  }, [selectedGame, selectedGameId, selectedSource, status]);

  const handleSelectGame = useCallback((game, source = "weekly") => {
    console.log("[AiGuideModal] handleSelectGame entered", {
      source,
      gameId: game?.id,
      gameName: game?.name,
      backendGameId: game?.gameId,
    });
    window.clearTimeout(searchTimerRef.current);
    setQuery(game.name);
    setSelectedGameId(game.id);
    setSelectedSource(source);
    setStatus("result");
  }, []);

  const updateDraftByGameId = useCallback((gameKey, nextDraft) => {
    if (!gameKey) return;

    setChatDrafts((prev) => ({
      ...prev,
      [gameKey]: nextDraft,
    }));
  }, []);

  const updateChatSession = useCallback((gameKey, updater) => {
    if (!gameKey) return;

    setChatSessions((prev) => {
      const previousSession = prev[gameKey] ?? { messages: [], isLoading: false };
      const nextSession =
        typeof updater === "function" ? updater(previousSession) : previousSession;

      return {
        ...prev,
        [gameKey]: nextSession,
      };
    });
  }, []);

  const handleSubmitQuestion = useCallback(
    async (quickQuestion, triggerSource = "unknown") => {
      console.log("[AiGuideModal] handleSubmitQuestion entered", {
        triggerSource,
        quickQuestion,
        currentDraft,
        selectedGame,
      });

      if (!selectedGame) {
        console.log("[AiGuideModal] handleSubmitQuestion early return: no selectedGame");
        return;
      }

      const nextQuestion = String(quickQuestion ?? currentDraft).trim();
      if (!nextQuestion) {
        console.log("[AiGuideModal] handleSubmitQuestion early return: empty question", {
          quickQuestion,
          currentDraft,
        });
        return;
      }

      const gameKey = selectedGame.id;
      const messageId = `${gameKey}-${Date.now()}`;

      updateDraftByGameId(gameKey, "");
      updateChatSession(gameKey, (previousSession) => ({
        ...previousSession,
        isLoading: true,
        messages: [
          ...previousSession.messages,
          {
            id: messageId,
            question: nextQuestion,
            answer: "",
            errorMessage: "",
            createdAt: null,
            status: "loading",
          },
        ],
      }));

      try {
        console.log("[AiGuideModal] about to call postAiChat", {
          backendGameId: selectedGame.gameId,
          gameName: selectedGame.name,
          question: nextQuestion,
        });
        const response = await postAiChat({
          gameId: selectedGame.gameId,
          question: nextQuestion,
          userId: null,
        });
        console.log("[AiGuideModal] postAiChat resolved", response);

        updateChatSession(gameKey, (previousSession) => ({
          ...previousSession,
          isLoading: false,
          messages: previousSession.messages.map((message) => {
            if (message.id !== messageId) {
              return message;
            }

            if (!response.success) {
              return {
                ...message,
                status: "error",
                answer: "",
                errorMessage:
                  response.errorMessage || "AI 응답을 가져오지 못했어요.",
                createdAt: response.createdAt,
                savedChatId: response.savedChatId,
              };
            }

            return {
              ...message,
              status: "done",
              answer: response.answer ?? "",
              errorMessage: "",
              createdAt: response.createdAt,
              savedChatId: response.savedChatId,
            };
          }),
        }));
      } catch (error) {
        console.log("[AiGuideModal] postAiChat failed", error);
        updateChatSession(gameKey, (previousSession) => ({
          ...previousSession,
          isLoading: false,
          messages: previousSession.messages.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  status: "error",
                  answer: "",
                  errorMessage: getApiErrorMessage(
                    error,
                    "AI 응답을 불러오는 중 문제가 생겼어요."
                  ),
                }
              : message
          ),
        }));
      }
    },
    [currentDraft, selectedGame, updateChatSession, updateDraftByGameId]
  );

  const handleSearch = useCallback(
    (eventOrSource, triggerSource = "unknown") => {
      const event =
        eventOrSource && typeof eventOrSource.preventDefault === "function"
          ? eventOrSource
          : null;
      const source =
        typeof eventOrSource === "string" ? eventOrSource : triggerSource;

      event?.preventDefault();
      console.log("[AiGuideModal] handleSearch entered", {
        source,
        query,
      });

      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        console.log("[AiGuideModal] handleSearch early return: empty query");
        return;
      }

      const normalizedQuery = normalizeKeyword(trimmedQuery);
      const numericQuery = /^\d+$/.test(normalizedQuery)
        ? Number(normalizedQuery)
        : null;
      window.clearTimeout(searchTimerRef.current);
      setStatus("loading");
      console.log("[AiGuideModal] handleSearch started loading", {
        trimmedQuery,
        normalizedQuery,
        numericQuery,
      });

      searchTimerRef.current = window.setTimeout(() => {
        const searchTargets = searchableGames.map((game) => ({
          gameId: game.gameId,
          gameName: game.name,
          normalizedGameName: normalizeKeyword(game.name),
          aliases: game.aliases ?? [],
          searchIndex: game.searchIndex,
        }));

        console.log("[AiGuideModal] handleSearch matching candidates", {
          normalizedQuery,
          totalGames: searchableGames.length,
          searchTargets,
        });

        const matchedGame =
          searchableGames.find((game) =>
            game.searchIndex.some(
              (keyword) =>
                keyword.includes(normalizedQuery) ||
                normalizedQuery.includes(keyword)
            )
          ) ??
          searchableGames.find((game) => {
            const normalizedGameName = normalizeKeyword(game.name);

            return (
              normalizedGameName.includes(normalizedQuery) ||
              normalizedQuery.includes(normalizedGameName)
            );
          }) ??
          searchableGames.find((game) =>
            numericQuery == null ? false : Number(game.gameId) === numericQuery
          ) ?? null;

        if (!matchedGame) {
          console.log("[AiGuideModal] handleSearch no match found", {
            normalizedQuery,
            numericQuery,
          });
          setSelectedGameId(null);
          setSelectedSource("search");
          setStatus("empty");
          return;
        }

        console.log("[AiGuideModal] handleSearch matched game", {
          gameId: matchedGame.id,
          gameName: matchedGame.name,
          backendGameId: matchedGame.gameId,
        });
        setSelectedGameId(matchedGame.id);
        setSelectedSource("search");
        setStatus("result");
      }, 380);
    },
    [query, searchableGames]
  );

  return (
    <section className="ai-guide-modal">
      <div className="ai-guide-modal__intro">
        <span className="ai-guide-modal__eyebrow">BOARDGAME GUIDE</span>
        <p className="ai-guide-modal__description">
          채팅형 화면보다 쉽게, 검색과 빠른 선택 중심으로 이번 주 게임과 기본
          룰을 먼저 살펴볼 수 있게 구성했어요.
        </p>
      </div>

      <div className="ai-guide-layout">
        <AiSearchPanel
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          isLoading={status === "loading"}
        />

        <AiWeeklyGameList
          games={weeklyGames}
          selectedGameId={selectedGameId}
          onSelectGame={(game) => handleSelectGame(game, "weekly")}
        />

        <AiGameDetailPanel
          game={selectedGame}
          status={status}
          source={selectedSource}
        />
      </div>

      <AiChatPanel
        game={selectedGame}
        messages={currentSession.messages}
        draft={currentDraft}
        isLoading={currentSession.isLoading}
        onDraftChange={(value) =>
          updateDraftByGameId(selectedGame?.id, value)
        }
        onSubmitQuestion={handleSubmitQuestion}
        onQuickQuestion={handleSubmitQuestion}
      />
    </section>
  );
}
