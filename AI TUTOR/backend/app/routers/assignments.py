from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, Role
from app.services.assignments import AssignmentService
from app.schemas.assignment import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse, AssignmentListResponse,
    AssignmentSubmissionCreate, AssignmentSubmissionUpdate, AssignmentSubmissionResponse,
    AssignmentGrading
)

router = APIRouter()

@router.post("/", response_model=AssignmentResponse)
def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: User = Depends(require_role(Role.tutor)),
    db: Session = Depends(get_db)
):
    """Crea un nuovo compito"""
    assignment_service = AssignmentService(db)
    assignment = assignment_service.create_assignment(assignment_data, current_user.id)
    
    # Ottieni i nomi per la risposta
    tutor = db.query(User).filter(User.id == assignment.tutor_id).first()
    student = db.query(User).filter(User.id == assignment.student_id).first()
    
    return AssignmentResponse(
        id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        instructions=assignment.instructions,
        subject=assignment.subject,
        due_date=assignment.due_date,
        points=assignment.points,
        is_published=assignment.is_published,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at,
        tutor_name=f"{tutor.first_name} {tutor.last_name}" if tutor else "Tutor",
        student_name=f"{student.first_name} {student.last_name}" if student else "Studente",
        has_submission=False,
        submission_status=None,
        submission_grade=None
    )

@router.get("/student", response_model=List[AssignmentResponse])
def get_student_assignments(
    include_completed: bool = Query(True, description="Includi compiti completati"),
    current_user: User = Depends(require_role(Role.student)),
    db: Session = Depends(get_db)
):
    """Ottiene i compiti di uno studente"""
    assignment_service = AssignmentService(db)
    assignments = assignment_service.get_assignments_for_student(current_user.id, include_completed)
    
    result = []
    for assignment in assignments:
        # Verifica se esiste una consegna
        submission = assignment_service.get_submission(assignment.id, current_user.id)
        
        # Ottieni i nomi
        tutor = db.query(User).filter(User.id == assignment.tutor_id).first()
        student = db.query(User).filter(User.id == assignment.student_id).first()
        
        result.append(AssignmentResponse(
            id=assignment.id,
            title=assignment.title,
            description=assignment.description,
            instructions=assignment.instructions,
            subject=assignment.subject,
            due_date=assignment.due_date,
            points=assignment.points,
            is_published=assignment.is_published,
            created_at=assignment.created_at,
            updated_at=assignment.updated_at,
            tutor_name=f"{tutor.first_name} {tutor.last_name}" if tutor else "Tutor",
            student_name=f"{student.first_name} {student.last_name}" if student else "Studente",
            has_submission=submission is not None,
            submission_status=submission.status if submission else None,
            submission_grade=submission.grade if submission else None
        ))
    
    return result

@router.get("/tutor", response_model=List[AssignmentResponse])
def get_tutor_assignments(
    current_user: User = Depends(require_role(Role.tutor)),
    db: Session = Depends(get_db)
):
    """Ottiene i compiti assegnati da un tutor"""
    assignment_service = AssignmentService(db)
    assignments = assignment_service.get_assignments_for_tutor(current_user.id)
    
    result = []
    for assignment in assignments:
        # Verifica se esiste una consegna
        submission = assignment_service.get_submission(assignment.id, assignment.student_id)
        
        # Ottieni i nomi
        tutor = db.query(User).filter(User.id == assignment.tutor_id).first()
        student = db.query(User).filter(User.id == assignment.student_id).first()
        
        result.append(AssignmentResponse(
            id=assignment.id,
            title=assignment.title,
            description=assignment.description,
            instructions=assignment.instructions,
            subject=assignment.subject,
            due_date=assignment.due_date,
            points=assignment.points,
            is_published=assignment.is_published,
            created_at=assignment.created_at,
            updated_at=assignment.updated_at,
            tutor_name=f"{tutor.first_name} {tutor.last_name}" if tutor else "Tutor",
            student_name=f"{student.first_name} {student.last_name}" if student else "Studente",
            has_submission=submission is not None,
            submission_status=submission.status if submission else None,
            submission_grade=submission.grade if submission else None
        ))
    
    return result

@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottiene un compito specifico"""
    assignment_service = AssignmentService(db)
    assignment = assignment_service.get_assignment(assignment_id, current_user.id)
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compito non trovato"
        )
    
    # Verifica se esiste una consegna (se è uno studente)
    submission = None
    if current_user.role == Role.student:
        submission = assignment_service.get_submission(assignment.id, current_user.id)
    
    # Ottieni i nomi
    tutor = db.query(User).filter(User.id == assignment.tutor_id).first()
    student = db.query(User).filter(User.id == assignment.student_id).first()
    
    return AssignmentResponse(
        id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        instructions=assignment.instructions,
        subject=assignment.subject,
        due_date=assignment.due_date,
        points=assignment.points,
        is_published=assignment.is_published,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at,
        tutor_name=f"{tutor.first_name} {tutor.last_name}" if tutor else "Tutor",
        student_name=f"{student.first_name} {student.last_name}" if student else "Studente",
        has_submission=submission is not None,
        submission_status=submission.status if submission else None,
        submission_grade=submission.grade if submission else None
    )

@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    current_user: User = Depends(require_role(Role.tutor)),
    db: Session = Depends(get_db)
):
    """Aggiorna un compito"""
    assignment_service = AssignmentService(db)
    assignment = assignment_service.update_assignment(assignment_id, assignment_data, current_user.id)
    
    # Ottieni i nomi per la risposta
    tutor = db.query(User).filter(User.id == assignment.tutor_id).first()
    student = db.query(User).filter(User.id == assignment.student_id).first()
    
    return AssignmentResponse(
        id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        instructions=assignment.instructions,
        subject=assignment.subject,
        due_date=assignment.due_date,
        points=assignment.points,
        is_published=assignment.is_published,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at,
        tutor_name=f"{tutor.first_name} {tutor.last_name}" if tutor else "Tutor",
        student_name=f"{student.first_name} {student.last_name}" if student else "Studente",
        has_submission=False,
        submission_status=None,
        submission_grade=None
    )

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    current_user: User = Depends(require_role(Role.tutor)),
    db: Session = Depends(get_db)
):
    """Elimina un compito"""
    assignment_service = AssignmentService(db)
    assignment_service.delete_assignment(assignment_id, current_user.id)
    return {"message": "Compito eliminato con successo"}

@router.post("/submit", response_model=AssignmentSubmissionResponse)
def submit_assignment(
    submission_data: AssignmentSubmissionCreate,
    current_user: User = Depends(require_role(Role.student)),
    db: Session = Depends(get_db)
):
    """Consegna un compito"""
    assignment_service = AssignmentService(db)
    submission = assignment_service.submit_assignment(submission_data, current_user.id)
    
    # Ottieni i nomi per la risposta
    assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    student = db.query(User).filter(User.id == submission.student_id).first()
    
    return AssignmentSubmissionResponse(
        id=submission.id,
        content=submission.content,
        status=submission.status,
        grade=submission.grade,
        feedback=submission.feedback,
        submitted_at=submission.submitted_at,
        graded_at=submission.graded_at,
        created_at=submission.created_at,
        assignment_title=assignment.title if assignment else "Compito",
        student_name=f"{student.first_name} {student.last_name}" if student else "Studente"
    )

@router.get("/{assignment_id}/submission", response_model=AssignmentSubmissionResponse)
def get_submission(
    assignment_id: int,
    current_user: User = Depends(require_role(Role.student)),
    db: Session = Depends(get_db)
):
    """Ottiene la consegna di uno studente per un compito"""
    assignment_service = AssignmentService(db)
    submission = assignment_service.get_submission(assignment_id, current_user.id)
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consegna non trovata"
        )
    
    # Ottieni i nomi per la risposta
    assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    student = db.query(User).filter(User.id == submission.student_id).first()
    
    return AssignmentSubmissionResponse(
        id=submission.id,
        content=submission.content,
        status=submission.status,
        grade=submission.grade,
        feedback=submission.feedback,
        submitted_at=submission.submitted_at,
        graded_at=submission.graded_at,
        created_at=submission.created_at,
        assignment_title=assignment.title if assignment else "Compito",
        student_name=f"{student.first_name} {student.last_name}" if student else "Studente"
    )

@router.post("/submissions/{submission_id}/grade", response_model=AssignmentSubmissionResponse)
def grade_submission(
    submission_id: int,
    grading_data: AssignmentGrading,
    current_user: User = Depends(require_role(Role.tutor)),
    db: Session = Depends(get_db)
):
    """Valuta una consegna"""
    assignment_service = AssignmentService(db)
    submission = assignment_service.grade_submission(submission_id, grading_data, current_user.id)
    
    # Ottieni i nomi per la risposta
    assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    student = db.query(User).filter(User.id == submission.student_id).first()
    
    return AssignmentSubmissionResponse(
        id=submission.id,
        content=submission.content,
        status=submission.status,
        grade=submission.grade,
        feedback=submission.feedback,
        submitted_at=submission.submitted_at,
        graded_at=submission.graded_at,
        created_at=submission.created_at,
        assignment_title=assignment.title if assignment else "Compito",
        student_name=f"{student.first_name} {student.last_name}" if student else "Studente"
    )

@router.get("/{assignment_id}/submissions", response_model=List[AssignmentSubmissionResponse])
def get_assignment_submissions(
    assignment_id: int,
    current_user: User = Depends(require_role(Role.tutor)),
    db: Session = Depends(get_db)
):
    """Ottiene tutte le consegne per un compito"""
    assignment_service = AssignmentService(db)
    submissions = assignment_service.get_submissions_for_assignment(assignment_id, current_user.id)
    
    result = []
    for submission in submissions:
        # Ottieni i nomi per la risposta
        assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
        student = db.query(User).filter(User.id == submission.student_id).first()
        
        result.append(AssignmentSubmissionResponse(
            id=submission.id,
            content=submission.content,
            status=submission.status,
            grade=submission.grade,
            feedback=submission.feedback,
            submitted_at=submission.submitted_at,
            graded_at=submission.graded_at,
            created_at=submission.created_at,
            assignment_title=assignment.title if assignment else "Compito",
            student_name=f"{student.first_name} {student.last_name}" if student else "Studente"
        ))
    
    return result