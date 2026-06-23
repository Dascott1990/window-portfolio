from datetime import datetime
from flask import Blueprint, request
from app.services.finance_service import FinanceService
from app.utils.response import success, created, no_content
from app.middleware.error_handlers import APIError

finance_bp = Blueprint("finance", __name__)
svc = FinanceService()

@finance_bp.get("/summary")
def get_summary():
    return success(svc.compute_summary(request.args.get("currency","CAD")))

@finance_bp.get("/timeline")
def get_timeline():
    return success(svc.compute_timeline(request.args.get("currency","CAD")))

@finance_bp.get("/schedules")
def list_schedules():
    return success([s.to_dict() for s in svc.list_schedules()])

@finance_bp.post("/schedules")
def create_schedule():
    d = request.get_json(force=True)
    missing = [f for f in ("label","amount","frequency","next_pay_date") if not d.get(f)]
    if missing:
        raise APIError(f"Missing: {', '.join(missing)}", 400)
    nxt = datetime.strptime(d["next_pay_date"], "%Y-%m-%d").date()
    s = svc.create_schedule(d["label"],d["amount"],d["frequency"],nxt,d.get("currency","CAD"))
    return created(s.to_dict())

@finance_bp.delete("/schedules/<sid>")
def delete_schedule(sid):
    svc.delete_schedule(sid)
    return no_content()

@finance_bp.get("/bills")
def list_bills():
    return success([b.to_dict() for b in svc.list_bills()])

@finance_bp.post("/bills")
def create_bill():
    d = request.get_json(force=True)
    missing = [f for f in ("name","amount","due_day") if d.get(f) is None]
    if missing:
        raise APIError(f"Missing: {', '.join(missing)}", 400)
    b = svc.create_bill(
        name=d["name"], amount=d["amount"], due_day=d["due_day"],
        category=d.get("category","other"), color=d.get("color","#ef4444"),
        emoji=d.get("emoji","bill"), autopay=d.get("autopay",False),
        currency=d.get("currency","CAD")
    )
    return created(b.to_dict())

@finance_bp.delete("/bills/<bid>")
def delete_bill(bid):
    svc.delete_bill(bid)
    return no_content()

@finance_bp.get("/envelopes")
def list_envelopes():
    return success([e.to_dict() for e in svc.list_envelopes()])

@finance_bp.post("/envelopes")
def create_envelope():
    d = request.get_json(force=True)
    missing = [f for f in ("name","target_total","per_cycle") if d.get(f) is None]
    if missing:
        raise APIError(f"Missing: {', '.join(missing)}", 400)
    e = svc.create_envelope(
        name=d["name"], target_total=d["target_total"], per_cycle=d["per_cycle"],
        emoji=d.get("emoji","save"), color=d.get("color","#a78bfa"),
        currency=d.get("currency","CAD")
    )
    return created(e.to_dict())

@finance_bp.post("/envelopes/<eid>/contribute")
def contribute(eid):
    d = request.get_json(force=True)
    if d.get("amount") is None:
        raise APIError("amount required", 400)
    return success(svc.contribute_envelope(eid, d["amount"]).to_dict())

@finance_bp.delete("/envelopes/<eid>")
def delete_envelope(eid):
    svc.delete_envelope(eid)
    return no_content()

@finance_bp.get("/card")
def get_card():
    return success(svc.get_or_create_nova_card(request.args.get("currency","CAD")).to_dict())

@finance_bp.post("/card/<cid>/freeze")
def freeze_card(cid):
    return success(svc.freeze_card(cid).to_dict())

@finance_bp.post("/card/<cid>/spend")
def card_spend(cid):
    d = request.get_json(force=True)
    if not d.get("merchant") or d.get("amount") is None:
        raise APIError("merchant and amount required", 400)
    txn, card = svc.card_spend(cid, d["merchant"], d["amount"], d.get("currency","CAD"))
    return created({"transaction":txn.to_dict(),"card":card.to_dict()})
