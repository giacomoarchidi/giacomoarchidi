from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.user import User, Role, StudentProfile, TutorProfile, ParentProfile
from app.schemas.auth import UserRegister, UserLogin, TokenData

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se la password è corretta"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera hash della password - bcrypt ha limite di 72 byte"""
    # Tronca la password a 72 caratteri per bcrypt
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGO)
    return encoded_jwt

def verify_token(token: str) -> TokenData:
    """Verifica e decodifica un JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGO])
        user_id_str: str = payload.get("sub")
        role: str = payload.get("role")
        
        if user_id_str is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Convert string user_id back to int
        user_id = int(user_id_str)
        token_data = TokenData(user_id=user_id, role=Role(role))
        return token_data
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido",
            headers={"WWW-Authenticate": "Bearer"},
        )

def create_user(db: Session, user_data: UserRegister) -> User:
    """Crea un nuovo utente con il relativo profilo"""
    # Verifica se l'email esiste già
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata"
        )
    
    # Crea l'utente
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )
    db.add(db_user)
    db.flush()  # Per ottenere l'ID
    
    # Crea il profilo specifico in base al ruolo
    if user_data.role == Role.student:
        profile = StudentProfile(
            user_id=db_user.id,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            school_level=user_data.school_level
        )
    elif user_data.role == Role.tutor:
        profile = TutorProfile(
            user_id=db_user.id,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            bio=user_data.bio,
            subjects=user_data.subjects.split(",") if user_data.subjects else [],
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
        db.add(profile)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Autentica un utente"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def get_user_profile_data(db: Session, user: User) -> Dict[str, Any]:
    """Ottiene i dati del profilo utente"""
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
