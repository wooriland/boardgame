"""OpenAI API 호출만 담당."""

import os

from openai import APIConnectionError, AuthenticationError, BadRequestError, OpenAI, OpenAIError, RateLimitError

from config import MAX_OUTPUT_TOKENS, MODEL_NAME, OPENAI_API_KEY_ENV_NAME
from prompts.prompt_templates import build_rulebook_qa_prompt, build_worldview_explanation_prompt


def create_openai_client() -> OpenAI:
    """Create an OpenAI client from the API key in `.env`."""
    api_key = os.getenv(OPENAI_API_KEY_ENV_NAME)

    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing in the .env file.")

    if "your_api_key" in api_key.lower():
        raise ValueError("Replace the placeholder OPENAI_API_KEY value in the .env file.")

    return OpenAI(api_key=api_key)


def generate_text(prompt: str) -> str:
    """Send a prompt to the OpenAI Responses API and return plain text."""
    client = create_openai_client()

    try:
        response = client.responses.create(
            model=MODEL_NAME,
            input=prompt,
            max_output_tokens=MAX_OUTPUT_TOKENS,
        )

        result_text = getattr(response, "output_text", "").strip()

        if not result_text:
            raise RuntimeError("OpenAI returned an empty text response.")

        return result_text

    except AuthenticationError as error:
        raise RuntimeError("OpenAI authentication failed. Check OPENAI_API_KEY in .env.") from error
    except RateLimitError as error:
        raise RuntimeError("OpenAI rate limit exceeded. Try again later.") from error
    except BadRequestError as error:
        raise RuntimeError("The OpenAI request was invalid. Check the model name and prompt input.") from error
    except APIConnectionError as error:
        raise RuntimeError("Failed to connect to OpenAI. Check your network connection.") from error
    except OpenAIError as error:
        raise RuntimeError(f"OpenAI API error: {error}") from error


def generate_chat_answer(prompt: str) -> str:
    """Generate a chat answer from a fully built prompt."""
    return generate_text(prompt)


def generate_worldview_explanation(game_name: str, document_title: str, document_content: str) -> str:
    """Generate a worldview explanation."""
    prompt = build_worldview_explanation_prompt(game_name, document_title, document_content)
    return generate_text(prompt)


def answer_rulebook_question(
    game_name: str,
    rulebook_title: str,
    rulebook_content: str,
    worldview_title: str,
    worldview_content: str,
    question_text: str,
) -> str:
    """Answer a gameplay question using both the rulebook and worldview documents."""
    prompt = build_rulebook_qa_prompt(
        game_name=game_name,
        rulebook_title=rulebook_title,
        rulebook_content=rulebook_content,
        worldview_title=worldview_title,
        worldview_content=worldview_content,
        question_text=question_text,
    )
    return generate_text(prompt)
