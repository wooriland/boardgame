import { api } from "./apiClient";

function normalizeAiChatResponse(payload = {}) {
  return {
    success: Boolean(payload?.success),
    answer: payload?.answer ?? null,
    savedChatId:
      payload?.savedChatId === null || payload?.savedChatId === undefined
        ? null
        : payload.savedChatId,
    createdAt: payload?.createdAt ?? null,
    errorMessage: payload?.errorMessage ?? null,
  };
}

export async function postAiChat({ gameId, question, userId = null }) {
  console.log("[aiChatApi] postAiChat entered", {
    gameId,
    question,
    userId,
  });

  if (gameId === undefined || gameId === null || gameId === "") {
    console.log("[aiChatApi] early return error: missing gameId");
    throw new Error("gameId is required.");
  }

  const normalizedQuestion = String(question ?? "").trim();
  if (!normalizedQuestion) {
    console.log("[aiChatApi] early return error: missing question");
    throw new Error("question is required.");
  }

  console.log("[aiChatApi] calling /api/ai/chat", {
    gameId,
    normalizedQuestion,
    userId,
  });
  const response = await api.post("/api/ai/chat", {
    gameId,
    question: normalizedQuestion,
    userId,
  });

  console.log("[aiChatApi] /api/ai/chat resolved", response);

  return normalizeAiChatResponse(response);
}
