"""Application configuration using Pydantic Settings.

Following FastAPI best practices from:
https://github.com/fastapi/full-stack-fastapi-template
"""
from typing import Annotated, Any, Literal

from pydantic import AnyUrl, BeforeValidator, PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    """Parse CORS origins from string or list."""
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    """Application settings with validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "LifeBridge"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-powered cross-border mobility assistant"

    # Security
    SECRET_KEY: str = "local-dev-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # CORS
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "lifebridge"
    POSTGRES_PASSWORD: str = "lifebridge"
    POSTGRES_DB: str = "lifebridge"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def DATABASE_URL(self) -> PostgresDsn:
        """Build database URL from components."""
        return PostgresDsn.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    # S3/Object Storage
    S3_ENDPOINT: str | None = None
    S3_BUCKET: str = "lifebridge"
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None
    S3_REGION: str = "us-east-1"
    S3_PUBLIC_BASE_URL: str | None = None

    # Optional: OpenAI for enhanced reasoning
    OPENAI_API_KEY: str | None = None

    # DigitalOcean Gradient AI
    # - mock: deterministic local fallback (no cloud credentials required)
    # - live: always call live Gradient services (credentials required)
    # - auto: live when credentials are present, otherwise fallback to mock
    GRADIENT_RUNTIME_MODE: Literal["mock", "live", "auto"] = "live"
    GRADIENT_ACCESS_TOKEN: str | None = None
    GRADIENT_WORKSPACE_ID: str | None = None
    GRADIENT_AGENT_ID: str | None = None
    GRADIENT_AGENT_ENDPOINT: str | None = None
    GRADIENT_AGENT_ACCESS_KEY: str | None = None
    GRADIENT_KNOWLEDGE_BASE_ID: str | None = None
    GRADIENT_DEFAULT_RETRIEVAL_K: int = 8
    GRADIENT_SUB_QUERY_RETRIEVAL_K: int = 12
    GRADIENT_ENDPOINT_TIMEOUT_SECONDS: int = 60
    GRADIENT_ENDPOINT_TIMEOUT_RETRIES: int = 1
    GRADIENT_ENDPOINT_TIMEOUT_RETRY_BACKOFF_SECONDS: float = 0.35
    GRADIENT_DISALLOW_DEEPSEEK_MODEL: bool = False
    GRADIENT_ALLOWED_MODEL_PATTERNS: str | None = None

    # Email (optional for future features)
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: str | None = None
    EMAILS_FROM_NAME: str | None = None

    # Environment
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    # Sentry (optional for error tracking)
    SENTRY_DSN: str | None = None

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        """Check if default secret is being used in production."""
        if self.ENVIRONMENT == "local":
            return
        insecure_defaults = {
            "changethis",
            "changethis-in-production-use-secure-random-key",
            "local-dev-secret-key",
            "lifebridge",
        }
        if value in insecure_defaults:
            message = (
                f"The value of {var_name} is using an insecure default. "
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "production":
                raise ValueError(message)

    def _check_gradient_requirements(self) -> None:
        """Validate Gradient runtime requirements."""
        if self.GRADIENT_RUNTIME_MODE != "live":
            return

        has_endpoint_mode = bool(self.GRADIENT_AGENT_ENDPOINT and self.GRADIENT_AGENT_ACCESS_KEY)
        has_sdk_mode = bool(self.GRADIENT_ACCESS_TOKEN and self.GRADIENT_WORKSPACE_ID)
        if has_endpoint_mode or has_sdk_mode:
            return

        raise ValueError(
            "GRADIENT_RUNTIME_MODE=live requires either "
            "(GRADIENT_AGENT_ENDPOINT + GRADIENT_AGENT_ACCESS_KEY) or "
            "(GRADIENT_ACCESS_TOKEN + GRADIENT_WORKSPACE_ID)"
        )

    def model_post_init(self, __context: Any) -> None:
        """Validate settings after initialization."""
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_gradient_requirements()


settings = Settings()  # type: ignore

