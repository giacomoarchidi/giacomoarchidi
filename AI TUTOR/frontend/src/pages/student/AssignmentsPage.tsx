import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  subject: string;
  due_date: string;
  points: number;
  is_published: boolean;
  created_at: string;
  tutor_name: string;
  has_submission: boolean;
  submission_status: 'pending' | 'submitted' | 'graded' | 'late';
  submission_grade?: number;
  submission_feedback?: string;
}

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Carica i dati dal backend
    const loadData = async () => {
      try {
        setLoading(true);
        
        // TODO: Implementare chiamata API reale
        // const assignmentsResponse = await studentApi.getAssignments();
        // setAssignments(assignmentsResponse);
        
        // Per ora imposta tutto vuoto (nessun dato di test)
        setAssignments([]);
        
      } catch (error) {
        console.error('Errore caricamento compiti:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
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

  const getStatusColor = (status: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const isLate = now > due && status !== 'submitted' && status !== 'graded';

    if (isLate) return 'bg-red-500/20 text-red-300 border border-red-500/30';
    
    switch (status) {
      case 'submitted':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'graded':
        return 'bg-cyan-500/20 text-green-300 border border-cyan-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const getStatusText = (status: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const isLate = now > due && status !== 'submitted' && status !== 'graded';

    if (isLate) return 'In ritardo';
    
    switch (status) {
      case 'submitted':
        return 'Consegnato';
      case 'graded':
        return 'Valutato';
      case 'pending':
        return 'In attesa';
      default:
        return status;
    }
  };

  const handleSubmitAssignment = async (assignmentId: number) => {
    if (!submissionText.trim()) return;
    
    setSubmitting(true);
    
    // Simula l'invio
    setTimeout(() => {
      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId 
          ? {
              ...assignment,
              has_submission: true,
              submission_status: 'submitted' as const
            }
          : assignment
      ));
      setSubmissionText('');
      setSelectedAssignment(null);
      setSubmitting(false);
    }, 2000);
  };

  const getGradeColor = (grade?: number) => {
    if (!grade) return 'text-white/60';
    if (grade >= 90) return 'text-green-400';
    if (grade >= 80) return 'text-blue-400';
    if (grade >= 70) return 'text-yellow-400';
    if (grade >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="mt-6 text-white/80 text-lg">Caricamento compiti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
                I Miei Compiti
              </h1>
              <p className="text-white/70 mt-2 text-lg">Gestisci le tue consegne e monitora i progressi</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Dashboard</span>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">Compiti Totali</p>
                <p className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">{assignments.length}</p>
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
                <p className="text-white/70 text-sm font-medium">Consegnati</p>
                <p className="text-3xl font-bold text-white group-hover:text-green-300 transition-colors duration-300">
                  {assignments.filter(a => a.has_submission).length}
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
                <p className="text-white/70 text-sm font-medium">In Attesa</p>
                <p className="text-3xl font-bold text-white group-hover:text-yellow-300 transition-colors duration-300">
                  {assignments.filter(a => a.submission_status === 'pending').length}
                </p>
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
                <p className="text-white/70 text-sm font-medium">Media Voti</p>
                <p className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
                  {(() => {
                    const gradedAssignments = assignments.filter(a => a.submission_grade !== undefined);
                    if (gradedAssignments.length === 0) return 'N/A';
                    const average = gradedAssignments.reduce((sum, a) => sum + (a.submission_grade || 0), 0) / gradedAssignments.length;
                    return Math.round(average);
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista Compiti */}
        {assignments.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Nessun compito assegnato</h3>
              <p className="text-white/60 text-lg mb-8">Al momento non ci sono compiti da completare</p>
              <Link 
                to="/student/dashboard"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Torna alla Dashboard</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => (
            <div key={assignment.id} className="group bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 hover:bg-white/15 shadow-xl">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        {assignment.subject}
                      </span>
                      <span className="bg-white/20 text-white/80 px-3 py-1 rounded-full text-sm">
                        {assignment.points} punti
                      </span>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(assignment.submission_status, assignment.due_date)}`}>
                        {getStatusText(assignment.submission_status, assignment.due_date)}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                      {assignment.title}
                    </h2>
                    
                    <p className="text-white/70 mb-4 text-lg leading-relaxed">
                      {assignment.description}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-white/60 text-sm">
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{assignment.tutor_name}</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Scadenza: {formatDateTime(assignment.due_date)}</span>
                      </span>
                      {assignment.submission_grade && (
                        <span className={`flex items-center space-x-2 font-semibold ${getGradeColor(assignment.submission_grade)}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Voto: {assignment.submission_grade}/100</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => setSelectedAssignment(assignment)}
                      className="group/btn bg-gradient-to-r from-blue-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                    >
                      <span className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Vedi Dettagli</span>
                      </span>
                    </button>
                    
                    {!assignment.has_submission && assignment.is_published && (
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="group/btn bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Consegna</span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                
                {assignment.submission_feedback && (
                  <div className="mt-6 p-6 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Feedback del Tutor
                    </h3>
                    <p className="text-white/80 leading-relaxed">{assignment.submission_feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </main>

      {/* Modal per dettagli compito e consegna */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedAssignment.title}</h2>
                  <p className="text-white/70 text-lg">{selectedAssignment.description}</p>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="text-white/60 hover:text-white transition-colors duration-300"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-white/5 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Istruzioni Dettagliate</h3>
                <div className="text-white/80 leading-relaxed whitespace-pre-line">
                  {selectedAssignment.instructions}
                </div>
              </div>
              
              {!selectedAssignment.has_submission && selectedAssignment.is_published && (
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Consegna Compito</h3>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Inserisci qui la tua risposta al compito..."
                    className="w-full h-64 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 resize-none"
                  />
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => setSelectedAssignment(null)}
                      className="px-6 py-3 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => handleSubmitAssignment(selectedAssignment.id)}
                      disabled={!submissionText.trim() || submitting}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {submitting ? (
                        <span className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Consegnando...</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Consegna</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
