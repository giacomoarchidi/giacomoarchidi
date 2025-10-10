import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  status: 'draft' | 'published';
  attachments?: {
    name: string;
    url: string;
    size: number;
  }[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
}

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Equazioni di Secondo Grado',
      subject: 'Matematica',
      description: 'Risolvi le seguenti equazioni quadratiche utilizzando il metodo più appropriato',
      dueDate: '2024-10-15',
      difficulty: 'medium',
      points: 20,
      status: 'published'
    },
    {
      id: '2',
      title: 'Fisica: Leggi di Newton',
      subject: 'Fisica',
      description: 'Applica le tre leggi di Newton a problemi pratici di meccanica',
      dueDate: '2024-10-18',
      difficulty: 'hard',
      points: 25,
      status: 'draft'
    }
  ]);

  const [students] = useState<Student[]>([
    { id: '1', name: 'Marco Rossi', email: 'marco.rossi@student.com', grade: '3° Liceo' },
    { id: '2', name: 'Giulia Bianchi', email: 'giulia.bianchi@student.com', grade: '3° Liceo' },
    { id: '3', name: 'Luca Verdi', email: 'luca.verdi@student.com', grade: '2° Liceo' },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
    title: '',
    subject: 'Matematica',
    description: '',
    dueDate: '',
    difficulty: 'medium',
    points: 10,
    status: 'draft'
  });

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const createAssignment = () => {
    if (!newAssignment.title || !newAssignment.description) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    // Simula l'upload dei file (in produzione, qui faresti una chiamata API)
    const attachments = uploadedFiles.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file), // In produzione, questo sarebbe l'URL del server
      size: file.size
    }));

    const assignment: Assignment = {
      id: Date.now().toString(),
      title: newAssignment.title!,
      subject: newAssignment.subject!,
      description: newAssignment.description!,
      dueDate: newAssignment.dueDate!,
      difficulty: newAssignment.difficulty!,
      points: newAssignment.points!,
      status: 'draft',
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setAssignments(prev => [...prev, assignment]);
    setNewAssignment({
      title: '',
      subject: 'Matematica',
      description: '',
      dueDate: '',
      difficulty: 'medium',
      points: 10,
      status: 'draft'
    });
    setUploadedFiles([]);
    setShowCreateForm(false);
    alert('✅ Compito creato con successo!' + (attachments.length > 0 ? ` (${attachments.length} file allegati)` : ''));
  };

  const publishAssignment = (id: string) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === id ? { ...assignment, status: 'published' } : assignment
      )
    );
    alert('Compito pubblicato! Gli studenti riceveranno una notifica.');
  };

  const deleteAssignment = (id: string) => {
    setAssignmentToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (assignmentToDelete) {
      setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentToDelete));
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAssignmentToDelete(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-cyan-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'hard': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Medio';
      case 'hard': return 'Difficile';
      default: return 'Sconosciuto';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/tutor/dashboard" 
            className="inline-flex items-center text-white/70 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Torna alla Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="text-4xl">📝</div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Assegna Compiti</h1>
                <p className="text-white/70 text-lg">Crea e gestisci i compiti per i tuoi studenti</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
            >
              ➕ Nuovo Compito
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-center">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-2xl font-bold text-white">{assignments.length}</div>
            <div className="text-white/70">Compiti Totali</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-white">{assignments.filter(a => a.status === 'published').length}</div>
            <div className="text-white/70">Pubblicati</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-center">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-2xl font-bold text-white">{assignments.filter(a => a.status === 'draft').length}</div>
            <div className="text-white/70">Bozze</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-white">{students.length}</div>
            <div className="text-white/70">Studenti</div>
          </div>
        </div>

        {/* Create Assignment Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Crea Nuovo Compito</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 mb-2">Titolo</label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Es. Equazioni di Secondo Grado"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 mb-2">Materia</label>
                    <select
                      value={newAssignment.subject}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="Matematica">Matematica</option>
                      <option value="Fisica">Fisica</option>
                      <option value="Chimica">Chimica</option>
                      <option value="Italiano">Italiano</option>
                      <option value="Inglese">Inglese</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/70 mb-2">Difficoltà</label>
                    <select
                      value={newAssignment.difficulty}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="easy">Facile</option>
                      <option value="medium">Medio</option>
                      <option value="hard">Difficile</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-2">Descrizione</label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Descrivi il compito e le istruzioni per gli studenti..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 mb-2">Scadenza</label>
                    <input
                      type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/70 mb-2">Punti</label>
                    <input
                      type="number"
                      value={newAssignment.points}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                {/* File Upload Section */}
                <div>
                  <label className="block text-white/70 mb-2">📎 Allegati (opzionale)</label>
                  <div className="border-2 border-dashed border-white/30 rounded-xl p-6 hover:border-blue-400/50 transition-all duration-300">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-white font-medium mb-1">Clicca per caricare file</p>
                      <p className="text-white/50 text-sm">PDF, DOC, TXT, immagini, ZIP (max 10MB)</p>
                    </label>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-white/70 text-sm font-medium mb-2">File caricati ({uploadedFiles.length}):</p>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3 group hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{file.name}</p>
                              <p className="text-white/50 text-sm">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="ml-3 w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100"
                            title="Rimuovi file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-white/70 mb-4">Assegna a Studenti</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {students.map(student => (
                      <label key={student.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(prev => [...prev, student.id]);
                            } else {
                              setSelectedStudents(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-white font-medium">{student.name}</div>
                          <div className="text-white/70 text-sm">{student.grade}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  Annulla
                </button>
                <button
                  onClick={createAssignment}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
                >
                  Crea Compito
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignments List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">I Tuoi Compiti</h2>
          
          <div className="space-y-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-6 bg-white/5 rounded-2xl border border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-xl font-bold text-white">{assignment.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(assignment.difficulty)}`}>
                        {getDifficultyText(assignment.difficulty)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        assignment.status === 'published' 
                          ? 'text-green-400 bg-cyan-500/20' 
                          : 'text-yellow-400 bg-yellow-500/20'
                      }`}>
                        {assignment.status === 'published' ? 'Pubblicato' : 'Bozza'}
                      </span>
                    </div>
                    <p className="text-white/70 mb-2">{assignment.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-white/60 mb-3">
                      <span>📅 Scadenza: {new Date(assignment.dueDate).toLocaleDateString('it-IT')}</span>
                      <span>🎯 Punti: {assignment.points}</span>
                      <span>📚 {assignment.subject}</span>
                    </div>
                    
                    {/* Attachments Display */}
                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-white/50 text-sm mb-2">📎 Allegati ({assignment.attachments.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {assignment.attachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 rounded-lg px-3 py-2 text-sm text-blue-400 transition-all duration-300 group"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="truncate max-w-[150px]">{file.name}</span>
                              <span className="text-blue-400/60">({formatFileSize(file.size)})</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {assignment.status === 'draft' && (
                      <button
                        onClick={() => publishAssignment(assignment.id)}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
                      >
                        📢 Pubblica
                      </button>
                    )}
                    <button
                      onClick={() => deleteAssignment(assignment.id)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg transition-colors border border-red-400/30"
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {assignments.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-white mb-2">Nessun compito creato</h3>
                <p className="text-white/70 mb-6">Inizia creando il tuo primo compito per i tuoi studenti</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
                >
                  ➕ Crea Primo Compito
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <Link
            to="/tutor/dashboard"
            className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            🔙 Torna alla Dashboard
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
              ⚠️ Attenzione!
            </h3>

            {/* Message */}
            <p className="text-white/90 text-center mb-2 text-lg">
              Sei sicuro di voler eliminare questo compito?
            </p>
            <p className="text-white/60 text-center mb-8 text-sm">
              Questa azione è irreversibile e tutti i dati associati saranno persi.
            </p>

            {/* Assignment Info */}
            {assignmentToDelete && (
              <div className="bg-white/10 rounded-2xl p-4 mb-6 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {assignments.find(a => a.id === assignmentToDelete)?.title}
                    </p>
                    <p className="text-white/60 text-sm">
                      {assignments.find(a => a.id === assignmentToDelete)?.subject}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={cancelDelete}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
              >
                ❌ Annulla
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50"
              >
                🗑️ Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
