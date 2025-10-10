import stripe
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.lesson import Lesson, LessonStatus
from app.models.payment import Payment, PaymentStatus
from app.models.user import TutorProfile, StudentProfile

# Configura Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def create_checkout_session(self, lesson_id: int, student_id: int) -> Dict[str, Any]:
        """Crea una sessione di checkout Stripe per una lezione"""
        # Ottieni la lezione
        lesson = self.db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lezione non trovata"
            )
        
        # Verifica che la lezione appartenga allo studente
        if lesson.student_id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non autorizzato a pagare questa lezione"
            )
        
        # Verifica che la lezione sia in attesa di pagamento
        if lesson.status != LessonStatus.pending_payment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La lezione non è in attesa di pagamento"
            )
        
        # Ottieni i dati del tutor per calcolare il prezzo
        tutor = self.db.query(TutorProfile).filter(TutorProfile.user_id == lesson.tutor_id).first()
        if not tutor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tutor non trovato"
            )
        
        # Calcola il prezzo
        duration_hours = (lesson.end_at - lesson.start_at).total_seconds() / 3600
        amount = int(tutor.hourly_rate * duration_hours * 100)  # Stripe usa centesimi
        
        # Crea o aggiorna il pagamento
        payment = self.db.query(Payment).filter(Payment.lesson_id == lesson_id).first()
        if not payment:
            payment = Payment(
                student_id=student_id,
                lesson_id=lesson_id,
                amount=amount / 100,  # Converti da centesimi
                currency="EUR",
                status=PaymentStatus.created
            )
            self.db.add(payment)
            self.db.flush()
        
        # Crea la sessione Stripe
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f'Lezione: {lesson.subject}',
                            'description': f'Lezione con {tutor.first_name} {tutor.last_name}',
                        },
                        'unit_amount': amount,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'{settings.FRONTEND_URL}/payments/success?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{settings.FRONTEND_URL}/payments/cancel',
                metadata={
                    'lesson_id': str(lesson_id),
                    'student_id': str(student_id),
                    'payment_id': str(payment.id)
                }
            )
            
            # Aggiorna il pagamento con l'ID della sessione
            payment.stripe_session_id = checkout_session.id
            self.db.commit()
            
            return {
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id,
                'payment_id': payment.id
            }
            
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Errore Stripe: {str(e)}"
            )

    def handle_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Gestisce i webhook di Stripe"""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payload non valido"
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firma non valida"
            )
        
        # Gestisci l'evento
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            return self._handle_checkout_completed(session)
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            return self._handle_payment_failed(payment_intent)
        
        return {'status': 'success', 'event_type': event['type']}

    def _handle_checkout_completed(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Gestisce il completamento del checkout"""
        lesson_id = session['metadata'].get('lesson_id')
        payment_id = session['metadata'].get('payment_id')
        
        if not lesson_id or not payment_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Metadata mancanti"
            )
        
        # Aggiorna il pagamento
        payment = self.db.query(Payment).filter(Payment.id == int(payment_id)).first()
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pagamento non trovato"
            )
        
        payment.status = PaymentStatus.paid
        payment.stripe_payment_intent_id = session['payment_intent']
        payment.receipt_url = session.get('receipt_url')
        payment.updated_at = datetime.utcnow()
        
        # Aggiorna la lezione
        lesson = self.db.query(Lesson).filter(Lesson.id == int(lesson_id)).first()
        if lesson:
            lesson.status = LessonStatus.confirmed
            lesson.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        # TODO: Invia email di conferma
        # send_lesson_confirmation_email.delay(lesson.id)
        
        return {
            'status': 'success',
            'lesson_id': lesson_id,
            'payment_id': payment_id,
            'message': 'Pagamento completato con successo'
        }

    def _handle_payment_failed(self, payment_intent: Dict[str, Any]) -> Dict[str, Any]:
        """Gestisce il fallimento del pagamento"""
        # Trova il pagamento tramite payment_intent_id
        payment = self.db.query(Payment).filter(
            Payment.stripe_payment_intent_id == payment_intent['id']
        ).first()
        
        if payment:
            payment.status = PaymentStatus.failed
            payment.updated_at = datetime.utcnow()
            self.db.commit()
        
        return {
            'status': 'success',
            'message': 'Pagamento fallito gestito'
        }

    def get_payment_status(self, payment_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Ottiene lo stato di un pagamento"""
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return None
        
        # Verifica autorizzazione
        if payment.student_id != user_id:
            return None
        
        return {
            'id': payment.id,
            'amount': payment.amount,
            'currency': payment.currency,
            'status': payment.status.value,
            'created_at': payment.created_at,
            'updated_at': payment.updated_at,
            'receipt_url': payment.receipt_url
        }

    def refund_payment(self, payment_id: int, admin_user_id: int, amount: Optional[float] = None) -> Dict[str, Any]:
        """Rimborsa un pagamento (solo admin)"""
        # TODO: Implementare controllo admin
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pagamento non trovato"
            )
        
        if payment.status != PaymentStatus.paid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Il pagamento non è stato completato"
            )
        
        refund_amount = amount or payment.amount
        
        try:
            refund = stripe.Refund.create(
                payment_intent=payment.stripe_payment_intent_id,
                amount=int(refund_amount * 100),  # Converti in centesimi
                reason='requested_by_customer'
            )
            
            # Aggiorna il pagamento
            payment.refunded_amount += refund_amount
            payment.refunded_at = datetime.utcnow()
            
            if payment.refunded_amount >= payment.amount:
                payment.status = PaymentStatus.refunded
            
            self.db.commit()
            
            return {
                'status': 'success',
                'refund_id': refund.id,
                'amount': refund_amount,
                'message': 'Rimborso effettuato con successo'
            }
            
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Errore rimborso: {str(e)}"
            )