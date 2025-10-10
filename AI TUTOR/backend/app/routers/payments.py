from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, Role
from app.services.payments import PaymentService

router = APIRouter()


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events"""
    payload = await request.body()
    signature = request.headers.get('stripe-signature')
    
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header"
        )
    
    payment_service = PaymentService(db)
    result = payment_service.handle_webhook(payload.decode('utf-8'), signature)
    
    return result


@router.get("/history")
async def get_payment_history(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles([Role.student, Role.parent, Role.admin])),
    db: Session = Depends(get_db)
):
    """Get payment history for current user"""
    payment_service = PaymentService(db)
    
    # For parents, get payments for their children
    student_id = current_user.id
    if current_user.role == Role.parent:
        # This would need to be implemented to get the parent's children
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Parent payment history not yet implemented"
        )
    elif current_user.role == Role.admin:
        # Admin can view all payments
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Admin payment history not yet implemented"
        )
    
    result = payment_service.get_payment_history(student_id, page, size)
    return result


@router.post("/{payment_id}/refund")
async def refund_payment(
    payment_id: int,
    amount: float = None,
    current_user: User = Depends(require_roles([Role.admin])),
    db: Session = Depends(get_db)
):
    """Process refund for a payment (admin only)"""
    payment_service = PaymentService(db)
    result = payment_service.refund_payment(payment_id, amount)
    return result
