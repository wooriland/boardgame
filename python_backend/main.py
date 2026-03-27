from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import uvicorn

from api.chat import router as chat_router
from models.chat_response import ChatResponse


def create_app() -> FastAPI:
    """Create the FastAPI application for Spring to call."""
    app = FastAPI(
        title="Wooriland AI Service",
        version="1.0.0",
        description="Internal AI API server used by the Spring backend.",
    )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_, exc: RequestValidationError) -> JSONResponse:
        response = ChatResponse.failure(error_message="Invalid request.", details=exc.errors())
        return JSONResponse(status_code=422, content=response.model_dump(by_alias=True))

    app.include_router(chat_router)
    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
