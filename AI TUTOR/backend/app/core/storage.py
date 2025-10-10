from abc import ABC, abstractmethod
from typing import BinaryIO, Optional
from minio import Minio
from minio.error import S3Error
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid
import os
from datetime import timedelta


class StorageInterface(ABC):
    """Abstract storage interface"""
    
    @abstractmethod
    def upload_file(self, file_data: BinaryIO, filename: str, content_type: str) -> str:
        """Upload file and return path"""
        pass
    
    @abstractmethod
    def get_presigned_url(self, file_path: str, expires_in: int = 3600) -> str:
        """Get presigned URL for file access"""
        pass
    
    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """Delete file"""
        pass
    
    @abstractmethod
    def download_stream(self, file_path: str) -> BinaryIO:
        """Download file as stream"""
        pass


class MinIOStorage(StorageInterface):
    """MinIO storage implementation for development"""
    
    def __init__(self):
        self.client = Minio(
            settings.S3_ENDPOINT_URL.replace("http://", "").replace("https://", ""),
            access_key=settings.S3_ACCESS_KEY,
            secret_key=settings.S3_SECRET_KEY,
            secure=settings.S3_USE_SSL
        )
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure bucket exists"""
        try:
            if not self.client.bucket_exists(settings.S3_BUCKET):
                self.client.make_bucket(settings.S3_BUCKET)
        except S3Error as e:
            print(f"Error creating bucket: {e}")
    
    def upload_file(self, file_data: BinaryIO, filename: str, content_type: str) -> str:
        """Upload file to MinIO"""
        # Generate unique filename
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = f"uploads/{unique_filename}"
        
        # Reset file pointer
        file_data.seek(0)
        
        try:
            self.client.put_object(
                bucket_name=settings.S3_BUCKET,
                object_name=file_path,
                data=file_data,
                length=-1,
                part_size=10*1024*1024,  # 10MB
                content_type=content_type
            )
            return file_path
        except S3Error as e:
            raise Exception(f"Failed to upload file: {e}")
    
    def get_presigned_url(self, file_path: str, expires_in: int = 3600) -> str:
        """Get presigned URL for file access"""
        try:
            url = self.client.presigned_get_object(
                bucket_name=settings.S3_BUCKET,
                object_name=file_path,
                expires=timedelta(seconds=expires_in)
            )
            return url
        except S3Error as e:
            raise Exception(f"Failed to generate presigned URL: {e}")
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from MinIO"""
        try:
            self.client.remove_object(settings.S3_BUCKET, file_path)
            return True
        except S3Error as e:
            print(f"Failed to delete file: {e}")
            return False
    
    def download_stream(self, file_path: str) -> BinaryIO:
        """Download file as stream"""
        try:
            response = self.client.get_object(settings.S3_BUCKET, file_path)
            return response
        except S3Error as e:
            raise Exception(f"Failed to download file: {e}")


class S3Storage(StorageInterface):
    """AWS S3 storage implementation for production"""
    
    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL if settings.S3_ENDPOINT_URL != "https://s3.amazonaws.com" else None,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION
        )
    
    def upload_file(self, file_data: BinaryIO, filename: str, content_type: str) -> str:
        """Upload file to S3"""
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = f"uploads/{unique_filename}"
        
        file_data.seek(0)
        
        try:
            self.client.upload_fileobj(
                file_data,
                settings.S3_BUCKET,
                file_path,
                ExtraArgs={'ContentType': content_type}
            )
            return file_path
        except ClientError as e:
            raise Exception(f"Failed to upload file: {e}")
    
    def get_presigned_url(self, file_path: str, expires_in: int = 3600) -> str:
        """Get presigned URL for file access"""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.S3_BUCKET, 'Key': file_path},
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {e}")
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from S3"""
        try:
            self.client.delete_object(Bucket=settings.S3_BUCKET, Key=file_path)
            return True
        except ClientError as e:
            print(f"Failed to delete file: {e}")
            return False
    
    def download_stream(self, file_path: str) -> BinaryIO:
        """Download file as stream"""
        try:
            response = self.client.get_object(Bucket=settings.S3_BUCKET, Key=file_path)
            return response['Body']
        except ClientError as e:
            raise Exception(f"Failed to download file: {e}")


class FileSystemStorage(StorageInterface):
    """Local filesystem storage for development/testing"""
    
    def __init__(self):
        self.base_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
        os.makedirs(self.base_path, exist_ok=True)
    
    def upload_file(self, file_data: BinaryIO, filename: str, content_type: str) -> str:
        """Upload file to local filesystem"""
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(self.base_path, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_data.read())
        
        return f"uploads/{unique_filename}"
    
    def get_presigned_url(self, file_path: str, expires_in: int = 3600) -> str:
        """Return local file path (no presigning needed)"""
        return f"/api/files/{file_path}"
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from filesystem"""
        try:
            full_path = os.path.join(self.base_path, file_path.replace("uploads/", ""))
            os.remove(full_path)
            return True
        except OSError:
            return False
    
    def download_stream(self, file_path: str) -> BinaryIO:
        """Download file as stream"""
        full_path = os.path.join(self.base_path, file_path.replace("uploads/", ""))
        return open(full_path, "rb")


# Storage factory
def get_storage() -> StorageInterface:
    """Get storage implementation based on environment"""
    # Use S3 only if credentials are configured
    if settings.S3_ENDPOINT_URL and settings.S3_ACCESS_KEY and settings.S3_SECRET_KEY:
        return S3Storage()
    else:
        # Fallback to filesystem storage
        return FileSystemStorage()


# Global storage instance
storage = get_storage()
