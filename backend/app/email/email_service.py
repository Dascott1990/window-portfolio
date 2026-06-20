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

    # ── Calendar ──────────────────────────────────────────────────────────────
    def send_event_confirmation(self, recipient: str, event) -> bool:
        subject = f"Event confirmed: {event.title}"
        html = f"""
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
          <h2 style="color:#3b82f6;margin-bottom:8px;">Calendar Event Confirmed</h2>
          <h3 style="margin:0 0 16px;">{event.title}</h3>
          <p><strong>Date:</strong> {event.event_date.strftime("%A, %B %d, %Y")}</p>
          <p><strong>Time:</strong> {event.event_time.strftime("%I:%M %p")}</p>
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
          <p><strong>Date:</strong> {event.event_date.strftime("%A, %B %d, %Y")}</p>
          <p><strong>Time:</strong> {event.event_time.strftime("%I:%M %p")}</p>
          {"<p><strong>Location:</strong> " + event.location + "</p>" if event.location else ""}
          <p style="margin-top:24px;color:#64748b;font-size:12px;">Dascott Portfolio</p>
        </div>
        """
        return self._send(subject, [recipient], html)

    def send_custom(self, recipient: str, subject: str, html_body: str) -> bool:
        return self._send(subject, [recipient], html_body)

    # ── NovaPay wallet emails ─────────────────────────────────────────────────

    def _base_template(self, accent: str, badge: str, body_html: str) -> str:
        return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#05070d;font-family:\'SF Pro Display\',Inter,system-ui,sans-serif;">
  <div style="max-width:520px;margin:40px auto;border-radius:20px;overflow:hidden;
              border:1px solid rgba(255,255,255,0.08);box-shadow:0 24px 60px rgba(0,0,0,0.6);">
    <!-- Header -->
    <div style="padding:28px 32px 24px;background:linear-gradient(135deg,#0d1220,#111827);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:40px;height:40px;border-radius:12px;background:{accent}22;
                    border:1px solid {accent}44;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:20px;">💳</span>
        </div>
        <div>
          <div style="font-size:18px;font-weight:800;color:#fff;letter-spacing:0.02em;">NovaPay</div>
          <div style="font-size:10px;color:{accent};letter-spacing:0.14em;font-weight:700;">{badge}</div>
        </div>
      </div>
      {body_html}
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#070a12;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.6;">
        This is a real transaction notification from your NovaPay wallet.
        This is not a bank — it is a personal ledger system. If you did not
        initiate this action, no money has moved in any real financial institution.
      </p>
    </div>
  </div>
</body>
</html>"""

    def send_payment_sent(self, recipient: str, txn, sender_name: str = "NovaPay User") -> bool:
        """Sent to the RECIPIENT when someone sends them money."""
        amt  = f"{txn.currency} {float(txn.amount):,.2f}"
        body = f"""
          <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#fff;">You received money</h2>
          <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">A payment has been sent to you</p>
          <div style="background:rgba(57,255,136,0.08);border:1px solid rgba(57,255,136,0.2);
                      border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;">
            <div style="font-size:36px;font-weight:800;color:#39ff88;font-family:monospace;">{amt}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">from {sender_name}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-size:11px;color:rgba(255,255,255,0.35);
                           letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.06);">FROM</td>
                <td style="padding:8px 0;font-size:13px;color:#fff;text-align:right;
                           border-bottom:1px solid rgba(255,255,255,0.06);">{txn.merchant}</td></tr>
            <tr><td style="padding:8px 0;font-size:11px;color:rgba(255,255,255,0.35);
                           letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.06);">METHOD</td>
                <td style="padding:8px 0;font-size:13px;color:#fff;text-align:right;
                           border-bottom:1px solid rgba(255,255,255,0.06);">{(txn.method or "wallet").upper()}</td></tr>
            <tr><td style="padding:8px 0;font-size:11px;color:rgba(255,255,255,0.35);
                           letter-spacing:0.1em;">TX ID</td>
                <td style="padding:8px 0;font-size:10px;color:rgba(201,168,76,0.8);
                           text-align:right;font-family:monospace;">{txn.id}</td></tr>
          </table>
          {"<p style=\"margin:16px 0 0;padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:12px;color:rgba(255,255,255,0.5);\">Note: " + txn.notes + "</p>" if txn.notes else ""}
        """
        return self._send(
            f"You received {amt} on NovaPay",
            [recipient],
            self._base_template("#39ff88", "PAYMENT RECEIVED", body),
        )

    def send_payment_confirmation(self, recipient: str, txn) -> bool:
        """Sent to the SENDER confirming their payment went through."""
        amt  = f"{txn.currency} {float(txn.amount):,.2f}"
        body = f"""
          <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#fff;">Payment confirmed</h2>
          <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">Your payment was sent successfully</p>
          <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);
                      border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;">
            <div style="font-size:36px;font-weight:800;color:#C9A84C;font-family:monospace;">{amt}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">to {txn.merchant}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-size:11px;color:rgba(255,255,255,0.35);
                           letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.06);">TO</td>
                <td style="padding:8px 0;font-size:13px;color:#fff;text-align:right;
                           border-bottom:1px solid rgba(255,255,255,0.06);">{txn.merchant}</td></tr>
            <tr><td style="padding:8px 0;font-size:11px;color:rgba(255,255,255,0.35);
                           letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.06);">STATUS</td>
                <td style="padding:8px 0;font-size:13px;color:#39ff88;text-align:right;font-weight:700;
                           border-bottom:1px solid rgba(255,255,255,0.06);">CONFIRMED</td></tr>
            <tr><td style="padding:8px 0;font-size:11px;color:rgba(255,255,255,0.35);
                           letter-spacing:0.1em;">TX ID</td>
                <td style="padding:8px 0;font-size:10px;color:rgba(201,168,76,0.8);
                           text-align:right;font-family:monospace;">{txn.id}</td></tr>
          </table>
        """
        return self._send(
            f"Payment of {amt} confirmed — NovaPay",
            [recipient],
            self._base_template("#C9A84C", "PAYMENT CONFIRMED", body),
        )

    def send_payment_declined(self, recipient: str, txn) -> bool:
        """Sent to the SENDER when their payment is declined."""
        amt    = f"{txn.currency} {float(txn.amount):,.2f}"
        reason = txn.decline_reason.replace("_", " ").title() if txn.decline_reason else "Declined"
        body   = f"""
          <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#fff;">Payment declined</h2>
          <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">Your payment could not be completed</p>
          <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);
                      border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;">
            <div style="font-size:36px;font-weight:800;color:#ef4444;font-family:monospace;">{amt}</div>
            <div style="font-size:13px;color:rgba(239,68,68,0.7);margin-top:4px;">{reason}</div>
          </div>
          <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.6;">
            No funds were moved. Top up your wallet and try again.
          </p>
        """
        return self._send(
            f"Payment of {amt} declined — NovaPay",
            [recipient],
            self._base_template("#ef4444", "PAYMENT DECLINED", body),
        )

    def send_payment_request(self, recipient: str, txn, requester_name: str = "NovaPay User") -> bool:
        """Sent to the person being asked for money."""
        amt  = f"{txn.currency} {float(txn.amount):,.2f}"
        body = f"""
          <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#fff;">Payment request</h2>
          <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">
            Someone is requesting money from you
          </p>
          <div style="background:rgba(59,124,255,0.08);border:1px solid rgba(59,124,255,0.2);
                      border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;">
            <div style="font-size:36px;font-weight:800;color:#3B7CFF;font-family:monospace;">{amt}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">
              requested by {requester_name}
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-size:11px;color:rgba(255,255,255,0.35);
                           letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.06);">REQUESTED BY</td>
                <td style="padding:8px 0;font-size:13px;color:#fff;text-align:right;
                           border-bottom:1px solid rgba(255,255,255,0.06);">{txn.merchant}</td></tr>
            <tr><td style="padding:8px 0;font-size:11px;color:rgba(255,255,255,0.35);
                           letter-spacing:0.1em;">STATUS</td>
                <td style="padding:8px 0;font-size:13px;color:#f59e0b;text-align:right;font-weight:700;">
                  PENDING</td></tr>
          </table>
          {"<p style=\"margin:16px 0 0;padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:12px;color:rgba(255,255,255,0.5);\">Note: " + txn.notes + "</p>" if txn.notes else ""}
        """
        return self._send(
            f"{requester_name} is requesting {amt} — NovaPay",
            [recipient],
            self._base_template("#3B7CFF", "PAYMENT REQUESTED", body),
        )

    def send_top_up_confirmation(self, recipient: str, txn) -> bool:
        """Sent to the wallet owner after a successful top-up."""
        amt  = f"{txn.currency} {float(txn.amount):,.2f}"
        body = f"""
          <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#fff;">Wallet topped up</h2>
          <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">
            Funds have been added to your NovaPay wallet
          </p>
          <div style="background:rgba(57,255,136,0.08);border:1px solid rgba(57,255,136,0.2);
                      border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;">
            <div style="font-size:36px;font-weight:800;color:#39ff88;font-family:monospace;">+{amt}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">added to balance</div>
          </div>
        """
        return self._send(
            f"Wallet topped up with {amt} — NovaPay",
            [recipient],
            self._base_template("#39ff88", "TOP-UP CONFIRMED", body),
        )