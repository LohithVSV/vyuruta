from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from models.reward_log import RewardLog
from models.tribute import Tribute
from models.user import User

CITY_XP_PER_DAY = 100
TRIBUTE_RATE_PERCENT = 1
TRIBUTE_DURATION = timedelta(days=7)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def create_temporary_tribute(
    debtor: User,
    creditor: User,
    db: Session,
    now: datetime | None = None,
) -> Tribute:
    current_time = now or utc_now()
    tribute = (
        db.query(Tribute)
        .filter(
            Tribute.debtor_id == debtor.id,
            Tribute.creditor_id == creditor.id,
        )
        .first()
    )
    if tribute is None:
        tribute = Tribute(
            debtor_id=debtor.id,
            creditor_id=creditor.id,
            tax_rate_percent=TRIBUTE_RATE_PERCENT,
            active=True,
            expires_at=current_time + TRIBUTE_DURATION,
        )
        db.add(tribute)
    else:
        tribute.tax_rate_percent = TRIBUTE_RATE_PERCENT
        tribute.active = True
        tribute.created_at = current_time
        tribute.expires_at = current_time + TRIBUTE_DURATION
    return tribute


def accrue_city_xp(user: User, db: Session, now: datetime | None = None) -> int:
    current_time = as_utc(now or utc_now())
    last_update = user.city_xp_updated_at
    if last_update is None:
        user.city_xp_updated_at = current_time
        return 0

    last_update = as_utc(last_update)
    if user.city is None:
        user.city_xp_updated_at = current_time
        return 0

    elapsed = current_time - last_update
    full_days = elapsed.days
    if full_days <= 0:
        return 0

    earned_xp = full_days * CITY_XP_PER_DAY
    accrual_end = last_update + timedelta(days=full_days)
    tribute_rows = (
        db.query(Tribute)
        .filter(
            Tribute.debtor_id == user.id,
            Tribute.active.is_(True),
        )
        .all()
    )
    tax_due = 0
    tax_shares = []
    for tribute in tribute_rows:
        if not tribute.active:
            continue
        if tribute.expires_at is None or as_utc(tribute.expires_at) <= current_time:
            tribute.active = False
        expires_at = as_utc(tribute.expires_at) if tribute.expires_at else last_update
        created_at = as_utc(tribute.created_at) if tribute.created_at else last_update
        taxable_start = max(last_update, created_at)
        taxable_end = min(accrual_end, expires_at)
        taxable_seconds = max(0, (taxable_end - taxable_start).total_seconds())
        taxable_xp = int(taxable_seconds * CITY_XP_PER_DAY / 86400)
        amount = taxable_xp * tribute.tax_rate_percent // 100
        if amount:
            tax_shares.append((tribute, amount))
            tax_due += amount

    tax_due = min(tax_due, earned_xp)
    user.xp += earned_xp - tax_due
    user.city_xp_updated_at = last_update + timedelta(days=full_days)

    if earned_xp - tax_due:
        db.add(RewardLog(
            user_id=user.id,
            currency_amount=0,
            xp_amount=earned_xp - tax_due,
            source="city_income",
        ))

    if tax_due:
        remaining_tax = tax_due
        for index, (debt, due) in enumerate(tax_shares):
            creditor = db.query(User).filter(User.id == debt.creditor_id).first()
            if creditor is None:
                continue
            amount = (
                remaining_tax
                if index == len(tax_shares) - 1
                else min(due, remaining_tax)
            )
            amount = min(amount, remaining_tax)
            creditor.xp += amount
            remaining_tax -= amount
            if amount:
                db.add(RewardLog(
                    user_id=creditor.id,
                    currency_amount=0,
                    xp_amount=amount,
                    source="city_tribute",
                ))

    return earned_xp
