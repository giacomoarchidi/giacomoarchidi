from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from fastapi import HTTPException, status

from app.models.assignment import Assignment, AssignmentSubmission, AssignmentStatus
from app.models.user import User, TutorProfile, StudentProfile
from app.schemas.assignment import (
    AssignmentCreate, AssignmentUpdate, AssignmentGrading,
    AssignmentSubmissionCreate, AssignmentSubmissionUpdate
)

class AssignmentService:
    def __init__(self, db: Session):
        self.db = db

    def create_assignment(self, assignment_data: AssignmentCreate, tutor_id: int) -> Assignment:
        """Crea un nuovo compito"""
        # Verifica che il tutor esista
        tutor = self.db.query(TutorProfile).filter(TutorProfile.user_id == tutor_id).first()
        if not tutor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tutor non trovato"
            )
        
        # Verifica che lo studente esista
        student = self.db.query(StudentProfile).filter(StudentProfile.user_id == assignment_data.student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Studente non trovato"
            )
        
        # Crea il compito
        assignment = Assignment(
            title=assignment_data.title,
            description=assignment_data.description,
            instructions=assignment_data.instructions,
            subject=assignment_data.subject,
            due_date=assignment_data.due_date,
            points=assignment_data.points,
            is_published=assignment_data.is_published,
            tutor_id=tutor_id,
            student_id=assignment_data.student_id
        )
        
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        
        return assignment

    def get_assignments_for_student(self, student_id: int, include_completed: bool = True) -> List[Assignment]:
        """Ottiene i compiti di uno studente"""
        query = self.db.query(Assignment).filter(Assignment.student_id == student_id)
        
        if not include_completed:
            # Esclude compiti con consegne valutate
            query = query.filter(
                ~Assignment.submissions.any(
                    AssignmentSubmission.status == AssignmentStatus.graded
                )
            )
        
        return query.order_by(desc(Assignment.due_date)).all()

    def get_assignments_for_tutor(self, tutor_id: int) -> List[Assignment]:
        """Ottiene i compiti assegnati da un tutor"""
        return self.db.query(Assignment).filter(
            Assignment.tutor_id == tutor_id
        ).order_by(desc(Assignment.created_at)).all()

    def get_assignment(self, assignment_id: int, user_id: int) -> Optional[Assignment]:
        """Ottiene un compito specifico con controllo autorizzazione"""
        assignment = self.db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            return None
        
        # Verifica autorizzazione
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # L'utente può vedere il compito se è lo studente, il tutor, o un admin
        if (assignment.student_id == user_id or 
            assignment.tutor_id == user_id or 
            user.role.value == "admin"):
            return assignment
        
        return None

    def update_assignment(self, assignment_id: int, assignment_data: AssignmentUpdate, tutor_id: int) -> Assignment:
        """Aggiorna un compito"""
        assignment = self.db.query(Assignment).filter(
            and_(Assignment.id == assignment_id, Assignment.tutor_id == tutor_id)
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Compito non trovato"
            )
        
        # Aggiorna i campi forniti
        if assignment_data.title is not None:
            assignment.title = assignment_data.title
        if assignment_data.description is not None:
            assignment.description = assignment_data.description
        if assignment_data.instructions is not None:
            assignment.instructions = assignment_data.instructions
        if assignment_data.subject is not None:
            assignment.subject = assignment_data.subject
        if assignment_data.due_date is not None:
            assignment.due_date = assignment_data.due_date
        if assignment_data.points is not None:
            assignment.points = assignment_data.points
        if assignment_data.is_published is not None:
            assignment.is_published = assignment_data.is_published
        
        assignment.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(assignment)
        
        return assignment

    def delete_assignment(self, assignment_id: int, tutor_id: int) -> bool:
        """Elimina un compito"""
        assignment = self.db.query(Assignment).filter(
            and_(Assignment.id == assignment_id, Assignment.tutor_id == tutor_id)
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Compito non trovato"
            )
        
        self.db.delete(assignment)
        self.db.commit()
        
        return True

    def submit_assignment(self, submission_data: AssignmentSubmissionCreate, student_id: int) -> AssignmentSubmission:
        """Consegna un compito"""
        # Verifica che il compito esista e appartenga allo studente
        assignment = self.db.query(Assignment).filter(
            and_(Assignment.id == submission_data.assignment_id, Assignment.student_id == student_id)
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Compito non trovato"
            )
        
        # Verifica che il compito sia pubblicato
        if not assignment.is_published:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Il compito non è ancora pubblicato"
            )
        
        # Verifica se esiste già una consegna
        existing_submission = self.db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.assignment_id == submission_data.assignment_id,
                AssignmentSubmission.student_id == student_id
            )
        ).first()
        
        if existing_submission:
            # Aggiorna la consegna esistente
            existing_submission.content = submission_data.content
            existing_submission.status = AssignmentStatus.submitted
            existing_submission.submitted_at = datetime.utcnow()
            existing_submission.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(existing_submission)
            
            return existing_submission
        else:
            # Crea una nuova consegna
            submission = AssignmentSubmission(
                assignment_id=submission_data.assignment_id,
                student_id=student_id,
                content=submission_data.content,
                status=AssignmentStatus.submitted,
                submitted_at=datetime.utcnow()
            )
            
            self.db.add(submission)
            self.db.commit()
            self.db.refresh(submission)
            
            return submission

    def get_submission(self, assignment_id: int, student_id: int) -> Optional[AssignmentSubmission]:
        """Ottiene la consegna di uno studente per un compito"""
        return self.db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.student_id == student_id
            )
        ).first()

    def grade_submission(self, submission_id: int, grading_data: AssignmentGrading, tutor_id: int) -> AssignmentSubmission:
        """Valuta una consegna"""
        # Verifica che la consegna esista e il tutor sia autorizzato
        submission = self.db.query(AssignmentSubmission).join(Assignment).filter(
            and_(
                AssignmentSubmission.id == submission_id,
                Assignment.tutor_id == tutor_id
            )
        ).first()
        
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consegna non trovata"
            )
        
        # Aggiorna la valutazione
        submission.grade = grading_data.grade
        submission.feedback = grading_data.feedback
        submission.status = AssignmentStatus.graded
        submission.graded_at = datetime.utcnow()
        submission.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(submission)
        
        return submission

    def get_submissions_for_assignment(self, assignment_id: int, tutor_id: int) -> List[AssignmentSubmission]:
        """Ottiene tutte le consegne per un compito"""
        # Verifica che il tutor sia autorizzato
        assignment = self.db.query(Assignment).filter(
            and_(Assignment.id == assignment_id, Assignment.tutor_id == tutor_id)
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Compito non trovato"
            )
        
        return self.db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id
        ).all()

    def get_late_assignments(self, student_id: int) -> List[Assignment]:
        """Ottiene i compiti in ritardo per uno studente"""
        now = datetime.utcnow()
        
        return self.db.query(Assignment).filter(
            and_(
                Assignment.student_id == student_id,
                Assignment.due_date < now,
                ~Assignment.submissions.any(
                    AssignmentSubmission.status.in_([AssignmentStatus.submitted, AssignmentStatus.graded])
                )
            )
        ).order_by(Assignment.due_date).all()
