"""Resend-based transactional email helper.

In dev without RESEND_API_KEY (or with EMAIL_DEBUG_TO_CONSOLE=True), prints the
payload to stdout instead of calling the network — useful for local password-
reset testing without a Resend account.
"""

from __future__ import annotations

import httpx
import structlog
from django.conf import settings

logger = structlog.get_logger("email")

RESEND_API_URL = "https://api.resend.com/emails"


def send_email(
    *,
    to: str | list[str],
    subject: str,
    html: str,
    text: str,
    from_email: str | None = None,
) -> None:
    sender = from_email or settings.DEFAULT_FROM_EMAIL
    recipients = [to] if isinstance(to, str) else list(to)

    if getattr(settings, "EMAIL_DEBUG_TO_CONSOLE", False):
        logger.info(
            "email_console",
            to=recipients,
            subject=subject,
            from_=sender,
            text=text,
        )
        return

    api_key = settings.RESEND_API_KEY
    if not api_key:
        logger.warning("email_skipped_no_api_key", to=recipients, subject=subject)
        return

    payload = {
        "from": sender,
        "to": recipients,
        "subject": subject,
        "html": html,
        "text": text,
    }
    try:
        resp = httpx.post(
            RESEND_API_URL,
            json=payload,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10.0,
        )
        resp.raise_for_status()
        logger.info("email_sent", to=recipients, subject=subject, id=resp.json().get("id"))
    except httpx.HTTPError as exc:
        logger.error("email_send_failed", to=recipients, subject=subject, error=str(exc))
        raise
