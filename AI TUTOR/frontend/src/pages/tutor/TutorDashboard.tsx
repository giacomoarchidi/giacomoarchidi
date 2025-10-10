import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { availabilityApi } from '../../api/availability';
import type { AvailabilitySlot } from '../../api/availability';
import { tutorApi } from '../../api/tutor';
import type { TutorStats } from '../../api/tutor';

interface Lesson {
  id: number;
  subject: string;
  start_at: string;
  end_at: string;
  status: string;
  student_name: string;
  room_slug?: string;
}

interface Availability {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const TutorDashboard: React.FC = () => {
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TutorStats | null>(null);
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [weekLessons, setWeekLessons] = useState<Lesson[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Lesson[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const weekdays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh ogni 30 secondi per vedere nuove richieste
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmLesson = async () => {
    if (!selectedLesson) return;
    
    setActionLoading(true);
    try {
      console.log('✅ Confermando lezione:', selectedLesson.id);
      await tutorApi.confirmLesson(selectedLesson.id);
      console.log('✅ Lezione confermata!');
      setShowConfirmModal(false);
      setSelectedLesson(null);
      // Ricarica i dati
      loadData();
    } catch (error) {
      console.error('❌ Errore conferma lezione:', error);
      alert('Errore durante la conferma. Riprova.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectLesson = async () => {
    if (!selectedLesson) return;
    
    setActionLoading(true);
    try {
      console.log('❌ Rifiutando lezione:', selectedLesson.id);
      await tutorApi.rejectLesson(selectedLesson.id);
      console.log('✅ Lezione rifiutata!');
      setShowRejectModal(false);
      setSelectedLesson(null);
      // Ricarica i dati
      loadData();
    } catch (error) {
      console.error('❌ Errore rifiuto lezione:', error);
      alert('Errore durante il rifiuto. Riprova.');
    } finally {
      setActionLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔵 Caricamento dati dashboard tutor...');
      
      // Carica lezioni dal backend
      try {
        console.log('📡 Chiamata API: /tutor/lessons');
        const lessonsData = await tutorApi.getLessons(1, 100);
        console.log('✅ Risposta API ricevuta:', lessonsData);
        console.log('📊 Numero totale lezioni:', lessonsData.lessons.length);
        
        const lessons = lessonsData.lessons.map(lesson => ({
          id: lesson.id,
          subject: lesson.subject,
          start_at: lesson.start_at,
          end_at: lesson.end_at,
          status: lesson.status,
          student_name: lesson.student_name || 'Studente',
          room_slug: lesson.room_slug
        }));
        
        setUpcomingLessons(lessons);
        
        // Filtra lezioni di oggi
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayFiltered = lessons.filter(lesson => {
          const lessonDate = new Date(lesson.start_at);
          return lessonDate >= today && lessonDate < tomorrow;
        });
        setTodayLessons(todayFiltered);
        console.log('✅ Lezioni oggi:', todayFiltered.length);
        
        // Filtra lezioni della settimana
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const weekFiltered = lessons.filter(lesson => {
          const lessonDate = new Date(lesson.start_at);
          return lessonDate >= today && lessonDate < weekEnd;
        });
        setWeekLessons(weekFiltered);
        console.log('✅ Lezioni settimana:', weekFiltered.length);
        
        // Filtra richieste pendenti (in attesa di conferma)
        console.log('🔍 TUTTE LE LEZIONI RICEVUTE:');
        lessons.forEach((l, index) => {
          console.log(`   [${index}] ID: ${l.id}, Status: "${l.status}" (tipo: ${typeof l.status}), Subject: ${l.subject}, Student: ${l.student_name}`);
        });
        
        console.log('🔍 Filtro per status === "pending_payment"...');
        const pending = lessons.filter(lesson => {
          const match = lesson.status === 'pending_payment';
          console.log(`   Lezione ${lesson.id}: status="${lesson.status}", match=${match}`);
          return match;
        });
        setPendingRequests(pending);
        console.log(`✅ RICHIESTE PENDENTI TROVATE: ${pending.length}`);
        if (pending.length > 0) {
          console.log('📋 Dettaglio richieste pendenti:', pending.map(l => ({ id: l.id, status: l.status, subject: l.subject })));
        }
        
      } catch (error) {
        console.error('❌ Errore nel caricamento lezioni:', error);
        console.log('ℹ️ Nessuna lezione trovata - impostazione valori a zero');
        // Fallback a dati vuoti - mostrerà 0 nelle statistiche
        setUpcomingLessons([]);
        setTodayLessons([]);
        setWeekLessons([]);
        setPendingRequests([]);
      }
      
      // Carica statistiche
      try {
        const statsData = await tutorApi.getStats();
        console.log('✅ Statistiche caricate:', statsData);
        setStats(statsData);
      } catch (error) {
        console.error('❌ Errore nel caricamento statistiche:', error);
      }

      // Carica disponibilità dal backend
      try {
        console.log('🔵 Tentativo caricamento disponibilità...');
        const backendAvailability = await availabilityApi.getAvailability();
        console.log('✅ Disponibilità caricate dalla API:', backendAvailability);
        
        // Converti nel formato della dashboard
        const dashboardAvailability: Availability[] = backendAvailability.map(slot => ({
          id: slot.id || 0,
          weekday: slot.weekday,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available
        }));
        
        setAvailability(dashboardAvailability);
        console.log('✅ Disponibilità impostate');
      } catch (error) {
        console.error('❌ Errore nel caricamento disponibilità:', error);
        // Fallback ai dati di default
        setAvailability([
          { id: 1, weekday: 1, start_time: '09:00', end_time: '17:00', is_available: true },
          { id: 2, weekday: 2, start_time: '09:00', end_time: '17:00', is_available: true },
          { id: 3, weekday: 3, start_time: '14:00', end_time: '18:00', is_available: true },
          { id: 4, weekday: 4, start_time: '09:00', end_time: '17:00', is_available: true },
          { id: 5, weekday: 5, start_time: '09:00', end_time: '15:00', is_available: true }
        ]);
        console.log('✅ Disponibilità di default impostate');
      }

      console.log('✅ Caricamento completato');
    } catch (error) {
      console.error('❌ ERRORE CRITICO nel loadData:', error);
    } finally {
      setLoading(false);
      console.log('✅ Loading terminato');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  const canStartLesson = (lesson: Lesson) => {
    const now = new Date();
    const startTime = new Date(lesson.start_at);
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    return lesson.status === 'confirmed' && minutesDiff <= 15 && minutesDiff >= -30;
  };

  const getAvailabilitySummary = () => {
    const totalDays = availability.filter(av => av.is_available).length;
    const totalHours = availability
      .filter(av => av.is_available)
      .reduce((total, av) => {
        const start = parseInt(av.start_time.split(':')[0]);
        const end = parseInt(av.end_time.split(':')[0]);
        return total + (end - start);
      }, 0);
    
    return { totalDays, totalHours };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-green-200 border-t-cyan-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="text-white/80 text-lg">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  const { totalDays, totalHours } = getAvailabilitySummary();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent flex items-center space-x-4">
                <span>Dashboard Tutor</span>
                {pendingRequests.length > 0 && (
                  <span className="relative">
                    <span className="flex h-10 w-10 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-8 w-8 bg-yellow-500 items-center justify-center text-white text-sm font-bold">
                        {pendingRequests.length}
                      </span>
                    </span>
                  </span>
                )}
          </h1>
              <p className="text-white/70 mt-2 text-lg">
                {pendingRequests.length > 0 
                  ? `🔔 Hai ${pendingRequests.length} ${pendingRequests.length === 1 ? 'richiesta' : 'richieste'} in attesa`
                  : 'Gestisci le tue lezioni e disponibilità'
                }
              </p>
            </div>
            <div className="flex space-x-4">
              <Link 
                to="/" 
                className="group bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </span>
              </Link>
              <Link 
                to="/tutor/availability" 
                className="group bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Gestisci Disponibilità</span>
                </span>
              </Link>
              <Link 
                to="/tutor/assignments" 
                className="group bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Assegna Compiti</span>
                </span>
              </Link>
              <Link 
                to="/profile" 
                className="group border-2 border-white/30 text-white px-6 py-3 rounded-full font-semibold backdrop-blur-sm hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profilo</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiche rapide */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-blue-400/50 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-4 group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
              <div>
                <p className="text-white/70 text-sm font-medium">Lezioni Oggi</p>
                <p className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
                  {loading ? '...' : todayLessons.length}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-green-400/50 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">
              <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl mr-4 group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
              <div>
                <p className="text-white/70 text-sm font-medium">Lezioni Settimana</p>
                <p className="text-3xl font-bold text-white group-hover:text-green-300 transition-colors duration-300">
                  {loading ? '...' : weekLessons.length}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-yellow-400/50 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10">
              <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl mr-4 group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
              <div>
                <p className="text-white/70 text-sm font-medium">Giorni Disponibili</p>
                <p className="text-3xl font-bold text-white group-hover:text-yellow-300 transition-colors duration-300">{totalDays}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-blue-400/50 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-4 group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
              <div>
                <p className="text-white/70 text-sm font-medium">Tariffa Oraria</p>
                <p className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">€25</p>
              </div>
            </div>
          </div>
        </div>

        {/* Richieste Pendenti */}
        {pendingRequests.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl border-2 border-yellow-400/30 shadow-xl">
            <div className="px-8 py-6 border-b border-yellow-400/30">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Richieste Pendenti
                <span className="ml-3 bg-yellow-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              </h2>
            </div>
            <div className="p-8 space-y-4">
              {pendingRequests.map((lesson) => (
                <div key={lesson.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{lesson.subject}</h3>
                      <p className="text-white/70 mb-1">con <span className="font-medium">{lesson.student_name}</span></p>
                      <p className="text-white/60 text-sm mb-3">
                        📅 {new Date(lesson.start_at).toLocaleString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <span className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-sm font-medium">
                        ⏳ In attesa di conferma
                      </span>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setShowConfirmModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:from-blue-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
                      >
                        ✅ Conferma
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setShowRejectModal(true);
                        }}
                        className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-all duration-300 border border-red-400/30 hover:border-red-400/50"
                      >
                        ❌ Rifiuta
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prossime Lezioni */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
            <div className="px-8 py-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Prossime Lezioni
              </h2>
            </div>
            <div className="p-8">
              {upcomingLessons.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-white/50 text-lg font-medium mb-2">Nessuna lezione programmata</p>
                  <p className="text-white/30 text-sm">Al momento non ci sono studenti o lezioni nella piattaforma</p>
            </div>
              ) : (
                <div className="space-y-6">
                  {upcomingLessons.map((lesson) => (
                    <div key={lesson.id} className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-green-300 transition-colors duration-300">{lesson.subject}</h3>
                          <p className="text-white/70 mb-1">con <span className="font-medium">{lesson.student_name}</span></p>
                          <p className="text-white/60 text-sm">{formatDateTime(lesson.start_at)}</p>
          </div>
                        <div className="flex flex-col items-end space-y-3">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            lesson.status === 'confirmed' ? 'bg-cyan-500/20 text-green-300 border border-cyan-500/30' :
                            lesson.status === 'pending_payment' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            lesson.status === 'cancelled' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {lesson.status === 'confirmed' ? 'Confermata' :
                             lesson.status === 'pending_payment' ? 'In attesa di conferma' :
                             lesson.status === 'cancelled' ? 'Annullata' :
                             lesson.status}
                          </span>
                          {canStartLesson(lesson) && (
                            <button
                              onClick={() => window.location.href = `/lessons/${lesson.id}/video`}
                              className="group/btn bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:from-blue-600 text-white px-4 py-2 text-sm rounded-lg font-medium shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300"
                            >
                              <span className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>🎥 Entra</span>
                              </span>
                            </button>
                          )}
                        </div>
              </div>
            </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Disponibilità */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
            <div className="px-8 py-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Disponibilità Settimanale
              </h2>
      </div>
            <div className="p-8">
              <div className="space-y-4">
                {availability.map((av) => (
                  <div key={av.id} className="group bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-white w-20 group-hover:text-blue-300 transition-colors duration-300">
                          {weekdays[av.weekday]}
                        </span>
                        <span className="text-white/70 text-sm">
                          {av.start_time} - {av.end_time}
                        </span>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        av.is_available 
                          ? 'bg-cyan-500/20 text-green-300 border border-cyan-500/30' 
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {av.is_available ? 'Disponibile' : 'Non disponibile'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
        <div className="flex items-center space-x-4">
          <Link 
            to="/tutor/availability" 
            className="group inline-flex items-center text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-300"
          >
            <span>Modifica disponibilità</span>
            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          
          <button
            onClick={loadData}
            className="group inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300"
            title="Aggiorna dati"
          >
            <svg className="w-4 h-4 mr-2 transform group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Aggiorna</span>
          </button>
        </div>
              </div>
            </div>
        </div>
      </div>

        {/* Sezioni aggiuntive */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Compiti Assegnati
            </h2>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                      </div>
              <h3 className="text-lg font-medium text-white mb-2">Nessun compito assegnato</h3>
              <p className="text-white/50 mb-6">Inizia assegnando compiti ai tuoi studenti</p>
                          <Link
                to="/tutor/assignments" 
                className="group inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                          >
                <span>Assegna Compito</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                          </Link>
                      </div>
                    </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Feedback Ricevuti
            </h2>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                  </div>
              <h3 className="text-lg font-medium text-white mb-2">Nessun feedback ricevuto</h3>
              <p className="text-white/50">I feedback dei genitori appariranno qui</p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Conferma Lezione */}
      {showConfirmModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl border-2 border-green-400/30 p-8 max-w-md w-full transform animate-in zoom-in-95 duration-300 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-20 h-20 bg-cyan-500 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white text-center mb-4">
              ✅ Conferma Lezione
            </h3>

            {/* Message */}
            <p className="text-white/90 text-center mb-2 text-lg">
              Sei sicuro di voler confermare questa lezione?
            </p>
            <p className="text-white/60 text-center mb-8 text-sm">
              Lo studente riceverà una notifica di conferma via email.
            </p>

            {/* Lesson Info */}
            <div className="bg-white/10 rounded-2xl p-4 mb-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{selectedLesson.subject}</p>
                  <p className="text-white/60 text-sm">
                    con {selectedLesson.student_name}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    📅 {new Date(selectedLesson.start_at).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedLesson(null);
                }}
                disabled={actionLoading}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ❌ Annulla
              </button>
              <button
                onClick={handleConfirmLesson}
                disabled={actionLoading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:from-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Conferma...</span>
                  </span>
                ) : (
                  '✅ Conferma'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rifiuta Lezione */}
      {showRejectModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl border-2 border-red-400/30 p-8 max-w-md w-full transform animate-in zoom-in-95 duration-300 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-20 h-20 bg-red-500 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white text-center mb-4">
              ⚠️ Rifiuta Richiesta
            </h3>

            {/* Message */}
            <p className="text-white/90 text-center mb-2 text-lg">
              Sei sicuro di voler rifiutare questa richiesta?
            </p>
            <p className="text-white/60 text-center mb-8 text-sm">
              Lo studente riceverà una notifica che la lezione è stata rifiutata.
            </p>

            {/* Lesson Info */}
            <div className="bg-white/10 rounded-2xl p-4 mb-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{selectedLesson.subject}</p>
                  <p className="text-white/60 text-sm">
                    con {selectedLesson.student_name}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    📅 {new Date(selectedLesson.start_at).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedLesson(null);
                }}
                disabled={actionLoading}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ❌ Annulla
              </button>
              <button
                onClick={handleRejectLesson}
                disabled={actionLoading}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Rifiuto...</span>
                  </span>
                ) : (
                  '🗑️ Rifiuta'
                )}
              </button>
            </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default TutorDashboard;