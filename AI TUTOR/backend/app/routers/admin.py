from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, Role
from app.models.lesson import Lesson
from app.models.payment import Payment
from app.schemas.admin import (
    AdminStatsResponse, UserListResponse, UserUpdateStatus,
    LessonListResponse, PaymentListResponse, PaymentRefund
)

router = APIRouter()

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: User = Depends(require_roles([Role.admin])),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    from app.services.admin import AdminService
    
    admin_service = AdminService(db)
    stats = admin_service.get_stats()
    return AdminStatsResponse(**stats)

@router.get("/users", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None),
    current_user: User = Depends(require_roles([Role.admin])),
    db: Session = Depends(get_db)
):
    """Get all users with optional role filter"""
    from app.services.admin import AdminService
    
    admin_service = AdminService(db)
    users, total = admin_service.get_users(page, size, role)
    
    return UserListResponse(
        data=users,
        total=total,
        page=page,
        size=size
    )

@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    current_user: User = Depends(require_roles([Role.admin])),
    db: Session = Depends(get_db)
):
    """Get user details by ID"""
    from app.services.admin import AdminService
    
    admin_service = AdminService(db)
    user = admin_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    status_data: UserUpdateStatus,
    current_user: User = Depends(require_roles([Role.admin])),
    db: Session = Depends(get_db)
):
    """Update user active status"""
    from app.services.admin import AdminService
    
    admin_service = AdminService(db)
    user = admin_service.update_user_status(user_id, status_data.is_active)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/lessons", response_model=LessonListResponse)
async def get_all_lessons(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_roles([Role.admin])),
    db: Session = Depends(get_db)
):
    """Get all lessons with optional status filter"""
    from app.services.admin import AdminService
    
    admin_service = AdminService(db)
    lessons, total = admin_service.get_lessons(page, size, status)
    
    return LessonListResponse(
        data=lessons,
        total=total,
        page=page,
        size=size
    )

@router.get("/lessons/{lesson_id}")
async def get_lesson(
    lesson_id: int,
    current_user: User = Depends(require_roles([Role.admin])),
    db: Session = Depends(get_db)
):
    """Get lesson details by ID"""
    from app.services.admin import AdminService
    
    admin_service = AdminService(db)
    lesson = admin_service.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    return lesson

@router.get("/payments", response_model=PaymentListResponse)
async def get_all_payments(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_roles([Role.admin])),
    db: Session = Depends(get_db)
):
    """Get all payments with optional status filter"""
    from app.services.admin import AdminService
    
    admin_service = AdminService(db)
    payments, total = admin_service.get_payments(page, size, status)
    
    return PaymentListResponse(
        data=payments,
        total=total,
        page=page,
        size=size
    )

@router.post("/payments/{payment_id}/refund")
async def refund_payment(
    payment_id: int,
    refund_data: PaymentRefund,
    current_user: User = Depends(require_roles([Role.admin])),
    db: Session = Depends(get_db)
):
    """Refund a payment (admin only)"""
    from app.services.admin import AdminService
    
    admin_service = AdminService(db)
    result = admin_service.refund_payment(payment_id, refund_data.reason)
    return result