from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.user import User, Role, StudentProfile, TutorProfile, ParentProfile
from app.schemas.auth import UserRegister, UserLogin, Token, UserProfile

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifica se la password è corretta"""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Genera hash della password"""
        # Tronca la password a 72 caratteri per bcrypt
        if len(password) > 72:
            password = password[:72]
        return pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Crea un JWT token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGO)
        return encoded_jwt

    def register_user(self, user_data: UserRegister) -> User:
        """Crea un nuovo utente con il relativo profilo"""
        # Verifica se l'email esiste già
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già registrata"
            )
        
        # Crea l'utente
        hashed_password = self.get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            role=user_data.role,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_active=True
        )
        
        self.db.add(user)
        self.db.flush()  # Per ottenere l'ID dell'utente
        
        # Crea il profilo specifico in base al ruolo
        if user_data.role == Role.student:
            profile = StudentProfile(
                user_id=user.id,
                grade_level=user_data.grade_level,
                subjects=user_data.subjects or []
            )
        elif user_data.role == Role.tutor:
            profile = TutorProfile(
                user_id=user.id,
                subjects=user_data.subjects or [],
                hourly_rate=user_data.hourly_rate or 0.0,
                bio=user_data.bio or "",
                experience_years=user_data.experience_years or 0
            )
        elif user_data.role == Role.parent:
            profile = ParentProfile(
                user_id=user.id,
                child_name=user_data.child_name or "",
                child_grade_level=user_data.child_grade_level or ""
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ruolo non valido"
            )
        
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(user)
        
        return user

    def login_user(self, login_data: UserLogin) -> Token:
        """Autentica un utente e restituisce un token"""
        user = self.db.query(User).filter(User.email == login_data.email).first()
        
        if not user or not self.verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenziali non valide"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account disabilitato"
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role.value},
            expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")

    def get_user_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Ottiene il profilo completo di un utente"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Ottieni il profilo specifico in base al ruolo
        if user.role == Role.student:
            profile = self.db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
        elif user.role == Role.tutor:
            profile = self.db.query(TutorProfile).filter(TutorProfile.user_id == user_id).first()
        elif user.role == Role.parent:
            profile = self.db.query(ParentProfile).filter(ParentProfile.user_id == user_id).first()
        else:
            return None
        
        if not profile:
            return None
        
        return {
            "id": user.id,
            "email": user.email,
            "role": user.role.value,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "profile": profile.__dict__
        }
