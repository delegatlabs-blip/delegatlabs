from enum import StrEnum


class AppSurface(StrEnum):
    ADMIN = "admin"
    USER = "user"
    WEB = "web"


class Environment(StrEnum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
