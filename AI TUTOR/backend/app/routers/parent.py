from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, Role
from app.models.lesson import Lesson
from app.models.report import Report
from app.schemas.parent import (
    ParentStatsResponse, ChildrenResponse, ChildResponse,
    ChildLessonsResponse, ReportsResponse, ReportResponse
)

router = APIRouter()

@router.get("/stats", response_model=ParentStatsResponse)
async def get_parent_stats(
    current_user: User = Depends(require_roles([Role.parent])),
    db: Session = Depends(get_db)
):
    """Get parent dashboard statistics"""
    from app.services.parent import ParentService
    
    parent_service = ParentService(db)
    stats = parent_service.get_stats(current_user.id)
    return ParentStatsResponse(**stats)

@router.get("/children", response_model=ChildrenResponse)
async def get_children(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles([Role.parent])),
    db: Session = Depends(get_db)
):
    """Get parent's children"""
    from app.services.parent import ParentService
    
    parent_service = ParentService(db)
    children, total = parent_service.get_children(current_user.id, page, size)
    
    return ChildrenResponse(
        data=children,
        total=total,
        page=page,
        size=size
    )

@router.get("/children/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: int,
    current_user: User = Depends(require_roles([Role.parent])),
    db: Session = Depends(get_db)
):
    """Get child details"""
    from app.services.parent import ParentService
    
    parent_service = ParentService(db)
    child = parent_service.get_child(current_user.id, child_id)
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or access denied"
        )
    return ChildResponse.model_validate(child)

@router.get("/children/{child_id}/lessons", response_model=ChildLessonsResponse)
async def get_child_lessons(
    child_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles([Role.parent])),
    db: Session = Depends(get_db)
):
    """Get child's lessons"""
    from app.services.parent import ParentService
    
    parent_service = ParentService(db)
    lessons, total = parent_service.get_child_lessons(current_user.id, child_id, page, size)
    
    return ChildLessonsResponse(
        data=lessons,
        total=total,
        page=page,
        size=size
    )

@router.get("/reports", response_model=ReportsResponse)
async def get_reports(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles([Role.parent])),
    db: Session = Depends(get_db)
):
    """Get reports for parent's children"""
    from app.services.parent import ParentService
    
    parent_service = ParentService(db)
    reports, total = parent_service.get_reports(current_user.id, page, size)
    
    return ReportsResponse(
        data=reports,
        total=total,
        page=page,
        size=size
    )

@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    current_user: User = Depends(require_roles([Role.parent])),
    db: Session = Depends(get_db)
):
    """Get specific report"""
    from app.services.parent import ParentService
    
    parent_service = ParentService(db)
    report = parent_service.get_report(current_user.id, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or access denied"
        )
    return ReportResponse.model_validate(report)

@router.get("/reports/{report_id}/download")
async def download_report(
    report_id: int,
    current_user: User = Depends(require_roles([Role.parent])),
    db: Session = Depends(get_db)
):
    """Download report PDF"""
    from fastapi.responses import StreamingResponse
    from app.services.parent import ParentService
    from app.core.storage import storage
    import io
    
    parent_service = ParentService(db)
    report = parent_service.get_report(current_user.id, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or access denied"
        )
    
    if not report.pdf_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF not available for this report"
        )
    
    try:
        # Get file from storage
        file_stream = storage.download_stream(report.pdf_path)
        
        return StreamingResponse(
            io.BytesIO(file_stream.read()),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=report_{report.id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error downloading report"
        )