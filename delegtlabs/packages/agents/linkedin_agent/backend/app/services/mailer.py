"""Outbound email.

Two backends behind one interface so the OTP flow never changes when SMTP arrives:

  * ConsoleMailer -- logs the message. Selected when SMTP_HOST is empty.
  * SmtpMailer    -- real delivery via smtplib. Selected as soon as SMTP_HOST is set.

Nothing here ever logs a live OTP code; the code is passed to the template only.
The console backend is the one exception and it guards on OTP_DEV_MODE, because a
developer with no SMTP server still needs some way to read the code.
"""
from __future__ import annotations

import asyncio
import logging
import smtplib
from abc import ABC, abstractmethod
from email.message import EmailMessage
from email.utils import formataddr

from app.core.config import settings

logger = logging.getLogger(__name__)


class Mailer(ABC):
    @abstractmethod
    async def send(self, *, to: str, subject: str, text_body: str, html_body: str | None = None) -> None:
        ...


class ConsoleMailer(Mailer):
    """No-op delivery for local development."""

    async def send(self, *, to: str, subject: str, text_body: str, html_body: str | None = None) -> None:
        if settings.OTP_DEV_MODE:
            logger.info(
                "[mailer:console] to=%s subject=%s\n%s",
                to,
                subject,
                text_body,
            )
        else:
            # Outside dev mode the body may contain a live credential -- log metadata only.
            logger.info("[mailer:console] to=%s subject=%s (body suppressed)", to, subject)


class SmtpMailer(Mailer):
    """Blocking smtplib call pushed to a worker thread to keep the event loop free."""

    async def send(self, *, to: str, subject: str, text_body: str, html_body: str | None = None) -> None:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL))
        message["To"] = to
        message.set_content(text_body)
        if html_body:
            message.add_alternative(html_body, subtype="html")

        await asyncio.to_thread(self._send_sync, message)

    @staticmethod
    def _send_sync(message: EmailMessage) -> None:
        with smtplib.SMTP(
            settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.SMTP_TIMEOUT_SECONDS
        ) as server:
            if settings.SMTP_STARTTLS:
                server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)


def get_mailer() -> Mailer:
    """Backend chosen per call so a config change does not need a restart in dev."""
    return SmtpMailer() if settings.SMTP_HOST else ConsoleMailer()


OTP_SUBJECT = "Your AntGrav sign-in code"


def render_otp_email(code: str, ttl_minutes: int) -> tuple[str, str]:
    """Returns (text_body, html_body) for a sign-in code."""
    text_body = (
        f"Your AntGrav sign-in code is {code}\n\n"
        f"It expires in {ttl_minutes} minutes and can only be used once.\n"
        "If you did not request this, you can safely ignore this email."
    )
    html_body = f"""\
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f5f7;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
    <div style="max-width:440px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:18px;color:#111827;">Your sign-in code</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
        Enter this code to finish signing in to AntGrav.
      </p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;
                  background:#f9fafb;border-radius:8px;padding:16px;text-align:center;">
        {code}
      </div>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
        Expires in {ttl_minutes} minutes and can only be used once.
        If you did not request this, you can ignore this email.
      </p>
    </div>
  </body>
</html>"""
    return text_body, html_body


async def send_otp_email(to: str, code: str) -> None:
    ttl_minutes = max(1, settings.OTP_TTL_SECONDS // 60)
    text_body, html_body = render_otp_email(code, ttl_minutes)
    await get_mailer().send(
        to=to, subject=OTP_SUBJECT, text_body=text_body, html_body=html_body
    )
