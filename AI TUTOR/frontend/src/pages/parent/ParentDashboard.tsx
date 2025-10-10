import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Student {
  id: number;
  name: string;
  school_level: string;
  avatar?: string;
}

interface Lesson {
  id: number;
  subject: string;
  start_at: string;
  end_at: string;
  status: string;
  tutor_name: string;
  student_name: string;
}

interface Report {
  id: number;
  student_name: string;
  period: string;
  status: string;
  created_at: string;
}

const ParentDashboard: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula il caricamento dei dati
    setTimeout(() => {
      const mockStudents: Student[] = [
        {
          id: 1,
          name: 'Mario Rossi',
          school_level: 'superiori',
          avatar: '👨‍🎓'
        },
        {
          id: 2,
          name: 'Giulia Rossi',
          school_level: 'medie',
          avatar: '👩‍🎓'
        }
      ];
      
      setStudents(mockStudents);
      setSelectedStudent(mockStudents[0]);
      
      setLessons([
        {
          id: 1,
          subject: 'Matematica',
          start_at: '2024-01-15T10:00:00Z',
          end_at: '2024-01-15T11:00:00Z',
          status: 'completed',
          tutor_name: 'Prof. Bianchi',
          student_name: 'Mario Rossi'
        },
        {
          id: 2,
          subject: 'Fisica',
          start_at: '2024-01-17T14:00:00Z',
          end_at: '2024-01-17T15:30:00Z',
          status: 'confirmed',
          tutor_name: 'Prof. Verdi',
          student_name: 'Mario Rossi'
        }
      ]);
      
      setReports([
        {
          id: 1,
          student_name: 'Mario Rossi',
          period: 'Gennaio 2024',
          status: 'published',
          created_at: '2024-01-31T10:00:00Z'
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-cyan-500/20 text-green-300 border border-cyan-500/30';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'pending_payment':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completata';
      case 'confirmed':
        return 'Confermata';
      case 'pending_payment':
        return 'In attesa pagamento';
      case 'cancelled':
        return 'Cancellata';
      default:
        return status;
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-cyan-500/20 text-green-300 border border-cyan-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-cyan-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="mt-6 text-white/80 text-lg">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Dashboard Genitore
          </h1>
              <p className="text-white/70 mt-2 text-lg">Monitora il progresso dei tuoi figli</p>
            </div>
            <div className="flex space-x-4">
              <Link 
                to="/parent/feedback" 
                className="group bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span>Lascia Feedback</span>
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
        {/* Selezione Studente */}
        {students.length > 1 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Seleziona Studente</h2>
            <div className="flex flex-wrap gap-4">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`group flex items-center space-x-4 px-6 py-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    selectedStudent?.id === student.id
                      ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{student.avatar}</span>
                  <div className="text-left">
                    <p className="font-semibold text-white text-lg group-hover:text-blue-300 transition-colors duration-300">{student.name}</p>
                    <p className="text-white/60 text-sm">{student.school_level}</p>
                  </div>
                </button>
              ))}
        </div>
      </div>
        )}

        {/* Statistiche rapide per lo studente selezionato */}
        {selectedStudent && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-blue-400/50 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-4 group-hover:rotate-12 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium">Lezioni Totali</p>
                  <p className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">24</p>
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
                  <p className="text-white/70 text-sm font-medium">Completate</p>
                  <p className="text-3xl font-bold text-white group-hover:text-green-300 transition-colors duration-300">18</p>
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
                  <p className="text-white/70 text-sm font-medium">In Arrivo</p>
                  <p className="text-3xl font-bold text-white group-hover:text-yellow-300 transition-colors duration-300">4</p>
              </div>
            </div>
          </div>

            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-blue-400/50 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-4 group-hover:rotate-12 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium">Report</p>
                  <p className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">{reports.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lezioni Recenti */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
            <div className="px-8 py-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Lezioni Recenti
              </h2>
            </div>
            <div className="p-8">
              {lessons.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-white/50 text-lg">Nessuna lezione trovata</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">{lesson.subject}</h3>
                          <p className="text-white/70 mb-1">con <span className="font-medium">{lesson.tutor_name}</span></p>
                          <p className="text-white/60 text-sm">{formatDateTime(lesson.start_at)}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-3">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(lesson.status)}`}>
                            {getStatusText(lesson.status)}
                          </span>
                          {lesson.status === 'completed' && (
                            <Link
                              to={`/parent/lesson-notes/${lesson.id}`}
                              className="group/btn text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300"
                            >
                              <span className="flex items-center space-x-2">
                                <span>Vedi Appunti</span>
                                <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Report Mensili */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
            <div className="px-8 py-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Report Mensili
              </h2>
            </div>
            <div className="p-8">
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
                  <p className="text-white/50 text-lg">Nessun report disponibile</p>
            </div>
              ) : (
                <div className="space-y-6">
                  {reports.map((report) => (
                    <div key={report.id} className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">{report.period}</h3>
                          <p className="text-white/70 mb-2">per <span className="font-medium">{report.student_name}</span></p>
                          <p className="text-white/60 text-sm">
                            {formatDateTime(report.created_at)}
                          </p>
                    </div>
                        <div className="flex flex-col items-end space-y-3">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${getReportStatusColor(report.status)}`}>
                            {report.status === 'published' ? 'Pubblicato' : 'Bozza'}
                          </span>
                          {report.status === 'published' && (
                      <Link
                              to={`/parent/reports/${report.id}`}
                              className="group/btn text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-300"
                            >
                              <span className="flex items-center space-x-2">
                                <span>Leggi Report</span>
                                <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </span>
                      </Link>
                          )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
              )}
            </div>
          </div>
      </div>

        {/* Sezioni aggiuntive */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Appunti delle Lezioni
            </h2>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Appunti disponibili</h3>
              <p className="text-white/50 mb-6">Visualizza gli appunti delle lezioni completate</p>
              <Link 
                to="/parent/lesson-notes" 
                className="group inline-flex items-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <span>Vedi Tutti gli Appunti</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              </div>
            </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Feedback Tutor
            </h2>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Lascia feedback</h3>
              <p className="text-white/50 mb-6">Condividi la tua esperienza con i tutor</p>
              <Link 
                to="/parent/feedback" 
                className="group inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <span>Lascia Feedback</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentDashboard;