from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.core.db import get_db
from app.core.security import verify_token
from app.models.user import User, Role
from app.services.auth import verify_token as auth_verify_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Ottiene l'utente corrente dal token JWT"""
    token = credentials.credentials
    token_data = auth_verify_token(token)
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente non trovato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utente disattivato"
        )
    
    return user

def require_role(required_role: Role):
    """Decorator per richiedere un ruolo specifico"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role and current_user.role != Role.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accesso negato. Ruolo richiesto: {required_role}"
            )
        return current_user
    return role_checker

def require_roles(required_roles: list[Role]):
    """Decorator per richiedere uno dei ruoli specificati"""
    def roles_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in required_roles and current_user.role != Role.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accesso negato. Ruoli richiesti: {', '.join([r.value for r in required_roles])}"
            )
        return current_user
    return roles_checker

# Dipendenze specifiche per ruolo
get_current_student = require_role(Role.student)
get_current_tutor = require_role(Role.tutor)
get_current_parent = require_role(Role.parent)
get_current_admin = require_role(Role.admin)

# Dipendenze per ruoli multipli
get_current_student_or_parent = require_roles([Role.student, Role.parent])
get_current_tutor_or_admin = require_roles([Role.tutor, Role.admin])
