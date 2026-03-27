def build_worldview_explanation_prompt(game_name: str, document_title: str, document_content: str) -> str:
    """Build a worldview explanation prompt."""
    return f"""
You are an AI that explains a board game's worldview.
Read the worldview document below and write a natural explanation for a first-time reader.

Rules:
- Base the explanation only on the document content.
- Do not invent any setting details that are not present in the document.
- Write a concise explanation in about 4 to 6 sentences.
- Preserve the tone, atmosphere, and narrative background of the document.

Game name:
{game_name}

Document title:
{document_title}

Worldview document:
{document_content}
""".strip()


def build_rulebook_qa_prompt(
    game_name: str,
    rulebook_title: str,
    rulebook_content: str,
    worldview_title: str,
    worldview_content: str,
    question_text: str,
) -> str:
    """Build a prompt that answers a rulebook question using both rulebook and worldview documents."""
    return f"""
You are an AI that answers board game questions.
Answer the user's question by checking both the rulebook and the worldview documents below.

Rules:
- Use the rulebook as the primary source for game rules, procedures, restrictions, and edge cases.
- Use the worldview document as supporting context for lore, setting, terms, factions, and thematic interpretation.
- If the rulebook and worldview conflict, prioritize the rulebook.
- Do not invent any information that is not supported by either document.
- If the answer is not confirmed by the documents, clearly say that it is not confirmed in the documents.
- Explain the reasoning briefly and clearly.
- End with a final line in this exact format:
  Source documents: {rulebook_title}, {worldview_title}

Game name:
{game_name}

Question:
{question_text}

Rulebook title:
{rulebook_title}

Rulebook content:
{rulebook_content}

Worldview title:
{worldview_title}

Worldview content:
{worldview_content}
""".strip()


def build_rulebook_only_qa_prompt(
    game_name: str,
    rulebook_title: str,
    rulebook_content: str,
    question_text: str,
) -> str:
    """Build a prompt that answers a rulebook question without worldview context."""
    return f"""
You are an AI that answers board game questions.
Answer the user's question by checking the rulebook document below.

Rules:
- Use the rulebook as the only source for game rules, procedures, restrictions, and edge cases.
- Do not invent any information that is not supported by the rulebook.
- If the answer is not confirmed by the rulebook, clearly say that it is not confirmed in the document.
- Explain the reasoning briefly and clearly.
- End with a final line in this exact format:
  Source documents: {rulebook_title}

Game name:
{game_name}

Question:
{question_text}

Rulebook title:
{rulebook_title}

Rulebook content:
{rulebook_content}
""".strip()
