from flask import current_app
from flask_mail import Message
from app import mail


class EmailService:
    def _send(self, subject: str, recipients: list, html_body: str, text_body: str = None):
        msg = Message(subject=subject, recipients=recipients, html=html_body, body=text_body or "")
        try:
            mail.send(msg)
            return True
        except Exception as exc:
            current_app.logger.error(f"EmailService._send failed: {exc}")
            return False

    def send_event_confirmation(self, recipient: str, event) -> bool:
        subject = f"Event confirmed: {event.title}"
        html = f"""
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
          <h2 style="color:#3b82f6;margin-bottom:8px;">Calendar Event Confirmed</h2>
          <h3 style="margin:0 0 16px;">{event.title}</h3>
          <p><strong>Date:</strong> {event.event_date.strftime('%A, %B %d, %Y')}</p>
          <p><strong>Time:</strong> {event.event_time.strftime('%I:%M %p')}</p>
          {"<p><strong>Location:</strong> " + event.location + "</p>" if event.location else ""}
          {"<p><strong>Notes:</strong> " + event.description + "</p>" if event.description else ""}
          <p style="margin-top:24px;color:#64748b;font-size:12px;">Dascott Portfolio</p>
        </div>
        """
        return self._send(subject, [recipient], html)

    def send_event_reminder(self, recipient: str, event, minutes_before: int) -> bool:
        if minutes_before == 0:
            when = "starting now"
        elif minutes_before < 60:
            when = f"in {minutes_before} minutes"
        elif minutes_before == 60:
            when = "in 1 hour"
        elif minutes_before == 1440:
            when = "tomorrow"
        else:
            when = f"in {minutes_before} minutes"
        subject = f"Reminder: {event.title} — {when}"
        html = f"""
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
          <h2 style="color:#f59e0b;margin-bottom:8px;">Reminder</h2>
          <h3 style="margin:0 0 4px;">{event.title}</h3>
          <p style="color:#f59e0b;">Starts {when}</p>
          <p><strong>Date:</strong> {event.event_date.strftime('%A, %B %d, %Y')}</p>
          <p><strong>Time:</strong> {event.event_time.strftime('%I:%M %p')}</p>
          {"<p><strong>Location:</strong> " + event.location + "</p>" if event.location else ""}
          <p style="margin-top:24px;color:#64748b;font-size:12px;">Dascott Portfolio</p>
        </div>
        """
        return self._send(subject, [recipient], html)

    def send_custom(self, recipient: str, subject: str, html_body: str) -> bool:
        return self._send(subject, [recipient], html_body)
