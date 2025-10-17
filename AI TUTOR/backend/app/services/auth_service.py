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
        db_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            role=user_data.role
        )
        self.db.add(db_user)
        self.db.flush()  # Per ottenere l'ID
        
        # Crea il profilo specifico in base al ruolo
        if user_data.role == Role.student:
            profile = StudentProfile(
                user_id=db_user.id,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                school_level=user_data.school_level
            )
        elif user_data.role == Role.tutor:
            subjects = user_data.subjects.split(",") if user_data.subjects else []
            profile = TutorProfile(
                user_id=db_user.id,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                bio=user_data.bio,
                subjects=subjects,
                hourly_rate=user_data.hourly_rate or 15.0
            )
        elif user_data.role == Role.parent:
            profile = ParentProfile(
                user_id=db_user.id,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                phone=user_data.phone
            )
        else:
            # Per admin non creiamo un profilo specifico
            profile = None
        
        if profile:
            self.db.add(profile)
        
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Autentica un utente"""
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    def login_user(self, login_data: UserLogin) -> Token:
        """Effettua il login e restituisce il token"""
        user = self.authenticate_user(login_data.email, login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenziali non valide",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Utente disattivato"
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={"sub": str(user.id), "role": user.role.value},
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    def get_user_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Ottiene i dati del profilo utente"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        profile_data = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        
        if user.role == Role.student and user.student_profile:
            profile_data.update({
                "first_name": user.student_profile.first_name,
                "last_name": user.student_profile.last_name,
                "school_level": user.student_profile.school_level,
            })
        elif user.role == Role.tutor and user.tutor_profile:
            profile_data.update({
                "first_name": user.tutor_profile.first_name,
                "last_name": user.tutor_profile.last_name,
                "bio": user.tutor_profile.bio,
                "subjects": user.tutor_profile.subjects,
                "hourly_rate": user.tutor_profile.hourly_rate,
                "is_verified": user.tutor_profile.is_verified,
            })
        elif user.role == Role.parent and user.parent_profile:
            profile_data.update({
                "first_name": user.parent_profile.first_name,
                "last_name": user.parent_profile.last_name,
                "phone": user.parent_profile.phone,
            })
        
        return profile_data

    def change_password(self, user_id: int, current_password: str, new_password: str) -> bool:
        """Cambia la password dell'utente"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        if not self.verify_password(current_password, user.hashed_password):
            return False
        
        user.hashed_password = self.get_password_hash(new_password)
        self.db.commit()
        return True

    def deactivate_user(self, user_id: int) -> bool:
        """Disattiva l'utente"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.is_active = False
        self.db.commit()
        return True
