from pydantic import BaseModel


class EmailConfigSchema(BaseModel):
    sending_domain: str = "outbound.acmesaas.com"
    daily_sending_limit: int = 200
    warmup_enabled: bool = True
    reply_to_email: str = "growth@acmesaas.com"
