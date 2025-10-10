from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, Role
from app.models.report import Report
from app.schemas.report import ReportResponse, ReportListResponse
from app.services.reports import ReportService

router = APIRouter()

@router.get("/", response_model=ReportListResponse)
async def get_reports(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get reports for current user"""
    report_service = ReportService(db)
    
    if current_user.role == Role.student:
        reports, total = report_service.get_student_reports(current_user.id, size), 0
        # For students, we don't paginate, just get recent reports
    elif current_user.role == Role.parent:
        # For parents, get reports for their children
        from app.services.parent import ParentService
        parent_service = ParentService(db)
        reports, total = parent_service.get_reports(current_user.id, page, size)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return ReportListResponse(
        data=[ReportResponse.model_validate(report) for report in reports],
        total=total,
        page=page,
        size=size
    )

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific report"""
    report_service = ReportService(db)
    
    if current_user.role == Role.student:
        reports = report_service.get_student_reports(current_user.id, 100)
        report = next((r for r in reports if r.id == report_id), None)
    elif current_user.role == Role.parent:
        from app.services.parent import ParentService
        parent_service = ParentService(db)
        report = parent_service.get_report(current_user.id, report_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    return ReportResponse.model_validate(report)

@router.get("/{report_id}/download")
async def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download report PDF"""
    from fastapi.responses import StreamingResponse
    from app.core.storage import storage
    import io
    
    report_service = ReportService(db)
    
    # Get report with access control
    if current_user.role == Role.student:
        reports = report_service.get_student_reports(current_user.id, 100)
        report = next((r for r in reports if r.id == report_id), None)
    elif current_user.role == Role.parent:
        from app.services.parent import ParentService
        parent_service = ParentService(db)
        report = parent_service.get_report(current_user.id, report_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
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

@router.post("/generate-monthly")
async def generate_monthly_report(
    student_id: int,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    current_user: User = Depends(require_roles([Role.admin, Role.tutor])),
    db: Session = Depends(get_db)
):
    """Generate monthly report for a student (admin/tutor only)"""
    report_service = ReportService(db)
    
    try:
        report = report_service.generate_monthly_report(student_id, month, year)
        return ReportResponse.model_validate(report)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )