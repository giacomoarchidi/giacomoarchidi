import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lessonsApi } from '../../api/lessons';
import type { TutorResponse } from '../../api/lessons';

interface Tutor {
  id: number;
  first_name: string;
  last_name: string;
  bio: string;
  subjects: string[];
  hourly_rate: number;
  rating: number;
  total_lessons: number;
  profile_image?: string;
  availability: {
    weekday: number;
    start_time: string;
    end_time: string;
  }[];
}

const SUBJECTS = [
  { id: 'matematica', name: 'Matematica', icon: '🔢', color: 'from-blue-500 to-cyan-500' },
  { id: 'fisica', name: 'Fisica', icon: '⚛️', color: 'from-blue-500 to-cyan-500' },
  { id: 'chimica', name: 'Chimica', icon: '🧪', color: 'from-cyan-500 to-blue-500' },
  { id: 'italiano', name: 'Italiano', icon: '📚', color: 'from-red-500 to-orange-500' },
  { id: 'inglese', name: 'Inglese', icon: '🇬🇧', color: 'from-indigo-500 to-blue-500' },
  { id: 'storia', name: 'Storia', icon: '🏛️', color: 'from-yellow-500 to-orange-500' },
  { id: 'filosofia', name: 'Filosofia', icon: '🤔', color: 'from-violet-500 to-blue-500' },
  { id: 'latino', name: 'Latino', icon: '🏺', color: 'from-amber-500 to-yellow-500' },
  { id: 'greco', name: 'Greco', icon: '🏛️', color: 'from-teal-500 to-cyan-500' },
  { id: 'geografia', name: 'Geografia', icon: '🌍', color: 'from-blue-500 to-cyan-500' },
  { id: 'informatica', name: 'Informatica', icon: '💻', color: 'from-blue-500 to-indigo-500' },
  { id: 'arte', name: 'Arte', icon: '🎨', color: 'from-cyan-500 to-rose-500' },
];

const WEEKDAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const BookLesson: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    duration: 60,
    notes: ''
  });
  const [booking, setBooking] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (selectedSubject) {
      loadTutors(selectedSubject);
    }
  }, [selectedSubject]);

  const loadTutors = async (subject: string) => {
    setLoading(true);
    try {
      console.log('🔵 Caricamento tutor per materia:', subject);
      const response = await lessonsApi.getTutorsBySubject(subject);
      console.log('✅ Tutor ricevuti:', response);
      
      // Converti la risposta nel formato del componente
      const tutorsData: Tutor[] = response.map(t => ({
        id: t.id,
        first_name: t.first_name,
        last_name: t.last_name,
        bio: t.bio || 'Tutor esperto',
        subjects: t.subjects,
        hourly_rate: t.hourly_rate,
        rating: t.rating || 5.0,
        total_lessons: t.total_lessons || 0,
        profile_image: t.profile_image,
        availability: t.availability || []
      }));
      
      setTutors(tutorsData);
      console.log('✅ Tutor impostati:', tutorsData.length);
    } catch (error) {
      console.error('❌ Errore caricamento tutor:', error);
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectInfo = (subjectId: string) => {
    return SUBJECTS.find(s => s.id === subjectId);
  };

  const handleBookLesson = async () => {
    if (!selectedTutor || !bookingData.date) {
      alert('Per favore seleziona una data');
      return;
    }

    setBooking(true);
    try {
      // Usa le 10:00 come orario di default (il tutor sceglierà l'orario esatto)
      const startDateTime = new Date(`${bookingData.date}T10:00:00`).toISOString();

      const lessonData = {
        tutor_id: selectedTutor.id,
        subject: selectedSubject || '',
        start_at: startDateTime,
        duration_minutes: bookingData.duration,
        objectives: bookingData.notes || undefined
      };

      console.log('📝 Prenotazione lezione:', lessonData);
      
      const result = await lessonsApi.createLesson(lessonData);
      console.log('✅ Lezione creata:', result);
      
      setShowBookingModal(false);
      setShowSuccessModal(true);
      setBookingData({ date: '', duration: 60, notes: '' });
      
    } catch (error) {
      console.error('❌ Errore prenotazione:', error);
      alert('Errore durante la prenotazione. Riprova.');
    } finally {
      setBooking(false);
    }
  };

  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Prenota una Lezione
                </h1>
                <p className="text-white/70 mt-2 text-lg">Scegli la materia e trova il tutor perfetto per te</p>
              </div>
              <div className="flex space-x-4">
                <Link 
                  to="/student/dashboard" 
                  className="group bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Dashboard</span>
                  </span>
                </Link>
                <Link 
                  to="/" 
                  className="group bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Home</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl mb-6">
              <svg className="w-20 h-20 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Quale materia vuoi studiare?</h2>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">
              Seleziona una materia per vedere tutti i tutor disponibili e prenota la tua prossima lezione
            </p>
          </div>

          {/* Griglia Materie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {SUBJECTS.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className="group relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border-2 border-white/20 hover:border-white/40 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${subject.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {subject.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                    {subject.name}
                  </h3>
                  <div className="flex items-center justify-center space-x-2 text-white/60 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="group-hover:text-white/80 transition-colors duration-300">Trova tutor</span>
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Info Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Tutor Qualificati</h3>
              <p className="text-white/60">Tutti i nostri tutor sono esperti nelle loro materie</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Orari Flessibili</h3>
              <p className="text-white/60">Scegli l'orario che preferisci in base alle disponibilità</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lezioni Online</h3>
              <p className="text-white/60">Impara comodamente da casa tua</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Vista Tutor
  const subjectInfo = getSubjectInfo(selectedSubject);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <button
                onClick={() => setSelectedSubject(null)}
                className="inline-flex items-center space-x-2 text-white/70 hover:text-white mb-2 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Cambia materia</span>
              </button>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center space-x-3">
                <span className="text-4xl">{subjectInfo?.icon}</span>
                <span>Tutor di {subjectInfo?.name}</span>
              </h1>
              <p className="text-white/70 mt-2 text-lg">Trova il tutor perfetto per le tue esigenze</p>
            </div>
            <div className="flex space-x-4">
              <Link 
                to="/" 
                className="group bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </span>
              </Link>
              <Link 
                to="/student/dashboard" 
                className="group border-2 border-white/30 text-white px-6 py-3 rounded-full font-semibold backdrop-blur-sm hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Dashboard</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="w-20 h-20 border-4 border-purple-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-cyan-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <p className="mt-6 text-white/80 text-lg">Caricamento tutor...</p>
          </div>
        ) : tutors.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-16">
            <div className="text-center">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Nessun tutor disponibile</h3>
              <p className="text-white/60 text-lg mb-8">
                Al momento non ci sono tutor disponibili per {subjectInfo?.name}
              </p>
              <button
                onClick={() => setSelectedSubject(null)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Scegli un'altra materia</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tutors.map((tutor) => (
              <div key={tutor.id} className="group bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden">
                <div className="p-8">
                  {/* Header Tutor */}
                  <div className="flex items-start space-x-6 mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold">
                        {tutor.first_name[0]}{tutor.last_name[0]}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-cyan-500 border-4 border-slate-900 rounded-full w-6 h-6"></div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {tutor.first_name} {tutor.last_name}
                      </h3>
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${i < Math.floor(tutor.rating) ? 'text-yellow-400' : 'text-white/20'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="text-white/80 ml-2">{tutor.rating}</span>
                        </div>
                        <span className="text-white/60">•</span>
                        <span className="text-white/60">{tutor.total_lessons} lezioni</span>
                      </div>
                      <p className="text-white/70 line-clamp-2">{tutor.bio}</p>
                    </div>
                  </div>

                  {/* Materie */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white/70 mb-3">MATERIE INSEGNATE</h4>
                    <div className="flex flex-wrap gap-2">
                      {tutor.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Disponibilità */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white/70 mb-3">DISPONIBILITÀ</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {tutor.availability.slice(0, 4).map((slot, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-2 border border-white/10">
                          <div className="text-white/80 text-sm font-medium">{WEEKDAYS[slot.weekday]}</div>
                          <div className="text-white/60 text-xs">{slot.start_time} - {slot.end_time}</div>
                        </div>
                      ))}
                    </div>
                    {tutor.availability.length > 4 && (
                      <p className="text-white/50 text-xs mt-2">+{tutor.availability.length - 4} altri slot</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div className="text-3xl font-bold text-white">
                      €{tutor.hourly_rate}
                      <span className="text-lg text-white/60 font-normal">/ora</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTutor(tutor);
                        setShowBookingModal(true);
                      }}
                      className="group/btn bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                    >
                      <span className="flex items-center space-x-2">
                        <span>Prenota</span>
                        <svg className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Prenotazione */}
      {showBookingModal && selectedTutor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl border-2 border-blue-400/30 p-8 max-w-2xl w-full transform animate-in zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  📅 Prenota Lezione
                </h3>
                <p className="text-white/70">
                  con {selectedTutor.first_name} {selectedTutor.last_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingData({ date: '', duration: 60, notes: '' });
                }}
                className="text-white/60 hover:text-white transition-colors duration-300"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info Tutor */}
            <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-white/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedTutor.first_name[0]}{selectedTutor.last_name[0]}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{selectedTutor.first_name} {selectedTutor.last_name}</h4>
                  <p className="text-white/60">{selectedSubject}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Tariffa oraria:</span>
                <span className="text-2xl font-bold text-white">€{selectedTutor.hourly_rate}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Data */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  📅 Seleziona la Data <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-400/30 rounded-2xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 hover:border-blue-400/50 hover:bg-blue-500/20 cursor-pointer"
                  style={{
                    colorScheme: 'dark',
                  }}
                />
                <style>{`
                  input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    opacity: 0.8;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.3s;
                  }
                  input[type="date"]::-webkit-calendar-picker-indicator:hover {
                    opacity: 1;
                    background: rgba(168, 85, 247, 0.2);
                    transform: scale(1.1);
                  }
                  input[type="date"]::-webkit-datetime-edit-fields-wrapper {
                    padding: 0;
                  }
                  input[type="date"]::-webkit-datetime-edit {
                    padding: 0;
                  }
                  input[type="date"]::-webkit-datetime-edit-text {
                    color: rgba(255, 255, 255, 0.6);
                    padding: 0 4px;
                  }
                  input[type="date"]::-webkit-datetime-edit-month-field,
                  input[type="date"]::-webkit-datetime-edit-day-field,
                  input[type="date"]::-webkit-datetime-edit-year-field {
                    color: white;
                    font-weight: 600;
                    padding: 4px;
                    border-radius: 6px;
                    transition: all 0.2s;
                  }
                  input[type="date"]::-webkit-datetime-edit-month-field:hover,
                  input[type="date"]::-webkit-datetime-edit-day-field:hover,
                  input[type="date"]::-webkit-datetime-edit-year-field:hover {
                    background: rgba(168, 85, 247, 0.3);
                  }
                `}</style>
                <p className="text-white/50 text-sm mt-2">Il tutor sceglierà l'orario esatto in base alla sua disponibilità</p>
              </div>

              {/* Durata */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  ⏱️ Durata della Lezione
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 30, label: '30 min', icon: '⚡' },
                    { value: 60, label: '1 ora', icon: '🕐' },
                    { value: 90, label: '1h 30min', icon: '📚' },
                    { value: 120, label: '2 ore', icon: '📖' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setBookingData({ ...bookingData, duration: option.value })}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        bookingData.duration === option.value
                          ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400 shadow-lg shadow-blue-500/50'
                          : 'bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-4xl mb-2">{option.icon}</div>
                      <div className="text-white font-bold text-lg">{option.label}</div>
                      {bookingData.duration === option.value && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  📝 Note (opzionale)
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder="Aggiungi eventuali note o richieste specifiche..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 resize-none"
                />
              </div>

              {/* Costo Totale */}
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-lg">Costo totale stimato:</span>
                  <span className="text-3xl font-bold text-white">
                    €{((selectedTutor.hourly_rate * bookingData.duration) / 60).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingData({ date: '', duration: 60, notes: '' });
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
              >
                ❌ Annulla
              </button>
              <button
                onClick={handleBookLesson}
                disabled={booking || !bookingData.date}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {booking ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Prenotazione...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>✅ Conferma Prenotazione</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl border-2 border-green-400/40 p-10 max-w-lg w-full transform animate-in zoom-in-95 duration-500 shadow-2xl">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-24 h-24 bg-cyan-500 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-3xl font-bold text-white text-center mb-4">
              🎉 Richiesta Inviata!
            </h3>

            {/* Message */}
            <p className="text-white/90 text-center mb-3 text-lg leading-relaxed">
              La tua richiesta di lezione è stata inviata con successo!
            </p>
            <p className="text-white/70 text-center mb-8 leading-relaxed">
              Il tutor riceverà una notifica e dovrà confermare la lezione. Riceverai un aggiornamento non appena il tutor risponderà.
            </p>

            {/* Info Box */}
            <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/20">
              <div className="flex items-start space-x-3 mb-3">
                <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-white font-semibold mb-2">⏳ Prossimi Passi:</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Il tutor vedrà la richiesta nella sua dashboard</li>
                    <li>• Potrà confermare o rifiutare la lezione</li>
                    <li>• Riceverai una notifica via email</li>
                    <li>• Controlla la tua dashboard per aggiornamenti</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setSelectedTutor(null);
                setSelectedSubject(null);
              }}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:from-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
            >
              ✅ Perfetto, Grazie!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookLesson;

