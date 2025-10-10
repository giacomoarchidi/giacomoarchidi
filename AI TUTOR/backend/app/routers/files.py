from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
from app.core.db import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.file import File as FileModel
from app.core.storage import storage

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file"""
    # Validate file size (max 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum 10MB allowed."
        )
    
    # Validate file type
    allowed_types = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not allowed"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        file_stream = io.BytesIO(file_content)
        
        # Upload to storage
        stored_path = storage.upload_file(
            file_data=file_stream,
            filename=file.filename,
            content_type=file.content_type
        )
        
        # Save file record to database
        file_record = FileModel(
            owner_user_id=current_user.id,
            original_filename=file.filename,
            stored_path=stored_path,
            content_type=file.content_type,
            file_size=len(file_content)
        )
        
        db.add(file_record)
        db.commit()
        db.refresh(file_record)
        
        return {
            "file_id": file_record.id,
            "filename": file.filename,
            "size": file_record.file_size,
            "content_type": file.content_type,
            "uploaded_at": file_record.created_at
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/{file_id}")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a file"""
    file_record = db.query(FileModel).filter(FileModel.id == file_id).first()
    
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Check if user can access this file
    if (file_record.owner_user_id != current_user.id and 
        not file_record.is_public and 
        current_user.role.value != "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if file has expired
    if file_record.is_expired:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="File has expired"
        )
    
    try:
        # Get file from storage
        file_stream = storage.download_stream(file_record.stored_path)
        
        # Return file as streaming response
        return StreamingResponse(
            io.BytesIO(file_stream.read()),
            media_type=file_record.content_type,
            headers={
                "Content-Disposition": f"attachment; filename={file_record.original_filename}",
                "Content-Length": str(file_record.file_size)
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file: {str(e)}"
        )


@router.get("/{file_id}/url")
async def get_file_url(
    file_id: int,
    expires_in: int = Query(3600, ge=300, le=86400),  # 5 min to 24 hours
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get presigned URL for file access"""
    file_record = db.query(FileModel).filter(FileModel.id == file_id).first()
    
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Check if user can access this file
    if (file_record.owner_user_id != current_user.id and 
        not file_record.is_public and 
        current_user.role.value != "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if file has expired
    if file_record.is_expired:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="File has expired"
        )
    
    try:
        # Generate presigned URL
        url = storage.get_presigned_url(file_record.stored_path, expires_in)
        
        return {
            "url": url,
            "expires_in": expires_in,
            "filename": file_record.original_filename,
            "size": file_record.file_size,
            "content_type": file_record.content_type
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate URL: {str(e)}"
        )


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file"""
    file_record = db.query(FileModel).filter(FileModel.id == file_id).first()
    
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Check if user can delete this file
    if (file_record.owner_user_id != current_user.id and 
        current_user.role.value != "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        # Delete from storage
        storage.delete_file(file_record.stored_path)
        
        # Delete from database
        db.delete(file_record)
        db.commit()
        
        return {"message": "File deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )


@router.get("/", response_model=list)
async def list_files(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's files"""
    offset = (page - 1) * size
    
    files = db.query(FileModel).filter(
        FileModel.owner_user_id == current_user.id
    ).order_by(FileModel.created_at.desc()).offset(offset).limit(size).all()
    
    total = db.query(FileModel).filter(FileModel.owner_user_id == current_user.id).count()
    
    return {
        "files": [
            {
                "id": file.id,
                "filename": file.original_filename,
                "size": file.file_size,
                "size_display": file.file_size_display,
                "content_type": file.content_type,
                "created_at": file.created_at,
                "is_expired": file.is_expired
            }
            for file in files
        ],
        "total": total,
        "page": page,
        "size": size
    }
