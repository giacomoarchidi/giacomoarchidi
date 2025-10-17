import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: string;
  subject: string;
  schoolLevel: string;
  bio: string;
  hourlyRate: string;
  childrenCount: string;
  primaryInterest: string;
}

const ProfileCreation: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'student',
    subject: '',
    schoolLevel: '',
    bio: '',
    hourlyRate: '',
    childrenCount: '',
    primaryInterest: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

   if (step === 1) {
  if (!formData.firstName.trim()) newErrors.firstName = 'Il nome è obbligatorio';
  if (!formData.lastName.trim()) newErrors.lastName = 'Il cognome è obbligatorio';
  if (!formData.email.trim()) newErrors.email = 'L\'email è obbligatoria';
  else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email non valida';
  if (!formData.password.trim()) newErrors.password = 'La password è obbligatoria';
  else if (formData.password.length < 6) newErrors.password = 'La password deve essere di almeno 6 caratteri';
  else if (formData.password.length > 72) newErrors.password = 'La password deve essere di massimo 72 caratteri';
  if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Conferma la password';
  else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Le password non coincidono';
}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (validateStep(currentStep)) {
    try {
      console.log('🔵 Step 1: Preparazione dati...');
      
      // Tronca la password a 72 caratteri per bcrypt
      const truncatedPassword = formData.password.length > 72 
        ? formData.password.substring(0, 72) 
        : formData.password;
      
      // Prepara i dati per la registrazione
      const registrationData = {
        email: formData.email,
        password: truncatedPassword, // Usa la password troncata
        role: formData.userType as 'student' | 'tutor' | 'parent',
        first_name: formData.firstName,
        last_name: formData.lastName,
        // Campi specifici per il ruolo
        ...(formData.userType === 'student' && {
          school_level: formData.schoolLevel
        }),
        ...(formData.userType === 'tutor' && {
          bio: formData.bio,
          subjects: formData.subject,
          hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined
        })
      };

        console.log('🔵 Step 2: Dati da inviare:', registrationData);

        // Registra l'utente
        console.log('🔵 Step 3: Chiamata API register...');
        const user = await authApi.register(registrationData);
        console.log('✅ Utente registrato con successo:', user);

        // Fai login automatico
        console.log('🔵 Step 4: Login automatico...');
        const authResponse = await authApi.login({
          email: formData.email,
          password: formData.password
        });
        console.log('✅ Login riuscito:', authResponse);

        // Controlla se la risposta è valida
        if (!authResponse || !authResponse.access_token) {
          throw new Error('Risposta di login non valida');
        }

        // Salva il token
        localStorage.setItem('token', authResponse.access_token);
        console.log('✅ Token salvato');

        // Reindirizza alla dashboard appropriata
        console.log('🔵 Step 5: Reindirizzamento a dashboard...');
        switch (formData.userType) {
          case 'student':
            navigate('/student/dashboard');
            break;
          case 'tutor':
            navigate('/tutor/dashboard');
            break;
          case 'parent':
            navigate('/parent/dashboard');
            break;
          default:
            navigate('/');
        }
      } catch (error: any) {
        console.error('❌ Errore durante la registrazione:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error data:', error.response?.data);
        const errorMessage = error.response?.data?.detail || 'Errore durante la registrazione';
        alert(`❌ ERRORE: ${errorMessage}`);
        setErrors({ submit: errorMessage });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Rimuovi l'errore quando l'utente inizia a digitare
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'student':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        );
      case 'tutor':
        return (
          <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'parent':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getAccountTypeTitle = (type: string) => {
    switch (type) {
      case 'student':
        return 'Studente';
      case 'tutor':
        return 'Tutor';
      case 'parent':
        return 'Genitore';
      default:
        return '';
    }
  };

  const getAccountTypeDescription = (type: string) => {
    switch (type) {
      case 'student':
        return 'Accedi alle lezioni, compiti e appunti generati dall\'AI';
      case 'tutor':
        return 'Gestisci le tue lezioni, studenti e genera contenuti educativi';
      case 'parent':
        return 'Monitora il progresso dei tuoi figli e ricevi report dettagliati';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <span className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">Tutor Platform</span>
            </Link>
            <div className="text-white/80">
              Passo {currentStep} di 2
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                currentStep >= 1 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                  : 'bg-white/20 text-white/60'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 transition-all duration-300 ${
                currentStep >= 2 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                  : 'bg-white/20'
              }`}></div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                currentStep >= 2 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                  : 'bg-white/20 text-white/60'
              }`}>
                2
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-white mb-4">Informazioni Personali</h1>
                  <p className="text-white/70 text-lg">Inserisci le tue informazioni di base per iniziare</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Nome</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.firstName ? 'border-red-400' : 'border-white/20 hover:border-white/40'
                      }`}
                      placeholder="Il tuo nome"
                    />
                    {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Cognome</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.lastName ? 'border-red-400' : 'border-white/20 hover:border-white/40'
                      }`}
                      placeholder="Il tuo cognome"
                    />
                    {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.email ? 'border-red-400' : 'border-white/20 hover:border-white/40'
                      }`}
                      placeholder="la-tua-email@esempio.com"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Password</label>
                   <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      maxLength={72}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.password ? 'border-red-400' : 'border-white/20 hover:border-white/40'
                      }`}
                      placeholder="6-72 caratteri"
                   />
                    {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Conferma Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.confirmPassword ? 'border-red-400' : 'border-white/20 hover:border-white/40'
                      }`}
                      placeholder="Ripeti la password"
                    />
                    {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 hover:from-blue-600 hover:to-cyan-600"
                  >
                    Continua
                    <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-white mb-4">Tipo di Account</h1>
                  <p className="text-white/70 text-lg">Scegli il tipo di account che meglio descrive il tuo ruolo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['student', 'tutor', 'parent'].map((type) => (
                    <div
                      key={type}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        formData.userType === type
                          ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, userType: type }))}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          {getAccountTypeIcon(type)}
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">{getAccountTypeTitle(type)}</h3>
                        <p className="text-white/70 text-sm">{getAccountTypeDescription(type)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Campi aggiuntivi basati sul tipo di account */}
                {formData.userType === 'student' && (
                  <div>
                    <label className="block text-white font-medium mb-4">Livello Scolastico</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { value: 'elementari', label: 'Elementari', icon: '📚', color: 'from-blue-500 to-cyan-500' },
                        { value: 'medie', label: 'Medie', icon: '🎒', color: 'from-cyan-500 to-blue-500' },
                        { value: 'superiori', label: 'Superiori', icon: '🎓', color: 'from-blue-500 to-cyan-500' },
                        { value: 'universita', label: 'Università', icon: '🏛️', color: 'from-orange-500 to-red-500' }
                      ].map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, schoolLevel: level.value }))}
                          className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                            formData.schoolLevel === level.value
                              ? `border-white/50 bg-gradient-to-r ${level.color} shadow-lg shadow-blue-500/25`
                              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                              {level.icon}
                            </div>
                            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                              formData.schoolLevel === level.value
                                ? 'text-white'
                                : 'text-white group-hover:text-blue-300'
                            }`}>
                              {level.label}
                            </h3>
                          </div>
                          
                          {/* Indicatore di selezione */}
                          {formData.schoolLevel === level.value && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Effetto hover */}
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${level.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.userType === 'tutor' && (
                  <div className="space-y-8">
                    {/* Materie - SELEZIONE MULTIPLA */}
                    <div>
                      <label className="block text-white font-medium mb-4">
                        Materie di Specializzazione
                        <span className="text-sm text-white/60 ml-2">(Seleziona una o più materie)</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { value: 'matematica', label: 'Matematica', icon: '📐', color: 'from-blue-500 to-indigo-500' },
                          { value: 'fisica', label: 'Fisica', icon: '⚛️', color: 'from-cyan-500 to-teal-500' },
                          { value: 'chimica', label: 'Chimica', icon: '🧪', color: 'from-blue-500 to-cyan-500' },
                          { value: 'italiano', label: 'Italiano', icon: '📝', color: 'from-red-500 to-orange-500' },
                          { value: 'inglese', label: 'Inglese', color: 'from-yellow-500 to-amber-500', icon: '🇬🇧' },
                          { value: 'storia', label: 'Storia', icon: '🏛️', color: 'from-gray-500 to-slate-500' }
                        ].map((subject) => {
                          const selectedSubjects = formData.subject ? formData.subject.split(',') : [];
                          const isSelected = selectedSubjects.includes(subject.value);
                          
                          return (
                            <button
                              key={subject.value}
                              type="button"
                              onClick={() => {
                                const currentSubjects = formData.subject ? formData.subject.split(',').filter(s => s) : [];
                                let newSubjects: string[];
                                
                                if (isSelected) {
                                  // Rimuovi materia
                                  newSubjects = currentSubjects.filter(s => s !== subject.value);
                                } else {
                                  // Aggiungi materia
                                  newSubjects = [...currentSubjects, subject.value];
                                }
                                
                                setFormData(prev => ({ ...prev, subject: newSubjects.join(',') }));
                              }}
                              className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                                isSelected
                                  ? `border-white/50 bg-gradient-to-r ${subject.color} shadow-lg`
                                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                              }`}
                            >
                              <div className="text-center">
                                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                                  {subject.icon}
                                </div>
                                <h3 className={`text-sm font-semibold transition-colors duration-300 ${
                                  isSelected
                                    ? 'text-white'
                                    : 'text-white group-hover:text-blue-300'
                                }`}>
                                  {subject.label}
                                </h3>
                              </div>
                              
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {formData.subject && (
                        <p className="text-white/80 text-sm mt-3">
                          Materie selezionate: <span className="font-semibold">{formData.subject.split(',').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</span>
                        </p>
                      )}
                    </div>

                    {/* Tariffa Oraria */}
                    <div>
                      <label className="block text-white font-medium mb-4">Tariffa Oraria (€)</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { value: '15', label: '€15/h', desc: 'Principiante' },
                          { value: '20', label: '€20/h', desc: 'Intermedio' },
                          { value: '25', label: '€25/h', desc: 'Esperto' },
                          { value: '30', label: '€30/h', desc: 'Specialista' }
                        ].map((rate) => (
                          <button
                            key={rate.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, hourlyRate: rate.value }))}
                            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                              formData.hourlyRate === rate.value
                                ? 'border-white/50 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25'
                                : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                            }`}
                          >
                            <div className="text-center">
                              <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                formData.hourlyRate === rate.value
                                  ? 'text-white'
                                  : 'text-white group-hover:text-blue-300'
                              }`}>
                                {rate.label}
                              </h3>
                              <p className={`text-xs transition-colors duration-300 ${
                                formData.hourlyRate === rate.value
                                  ? 'text-white/80'
                                  : 'text-white/60 group-hover:text-white/80'
                              }`}>
                                {rate.desc}
                              </p>
                            </div>
                            
                            {formData.hourlyRate === rate.value && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Biografia */}
                    <div>
                      <label className="block text-white font-medium mb-4">Biografia</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-white/40 resize-none"
                        placeholder="Racconta la tua esperienza, specializzazioni e metodo di insegnamento..."
                      />
                      <p className="text-white/60 text-sm mt-2">Massimo 500 caratteri</p>
                    </div>
                  </div>
                )}

                {formData.userType === 'parent' && (
                  <div className="space-y-6">
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Informazioni Genitore
                      </h3>
                      <p className="text-white/70 mb-6">
                        Come genitore, potrai monitorare i progressi dei tuoi figli, ricevere report mensili e lasciare feedback ai tutor.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-2">Numero di Figli</label>
                          <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, childrenCount: num.toString() }))}
                                className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                                  formData.childrenCount === num.toString()
                                    ? 'border-white/50 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25'
                                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                                }`}
                              >
                                <div className="text-center">
                                  <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                    formData.childrenCount === num.toString()
                                      ? 'text-white'
                                      : 'text-white group-hover:text-blue-300'
                                  }`}>
                                    {num}
                                  </h3>
                                  <p className={`text-xs transition-colors duration-300 ${
                                    formData.childrenCount === num.toString()
                                      ? 'text-white/80'
                                      : 'text-white/60 group-hover:text-white/80'
                                  }`}>
                                    {num === 1 ? 'Figlio' : 'Figli'}
                                  </p>
                                </div>
                                
                                {formData.childrenCount === num.toString() && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-white font-medium mb-2">Interesse Principale</label>
                          <div className="space-y-3">
                            {[
                              { value: 'progresso', label: 'Monitoraggio Progressi', icon: '📈' },
                              { value: 'comunicazione', label: 'Comunicazione Tutor', icon: '💬' },
                              { value: 'report', label: 'Report Mensili', icon: '📊' },
                              { value: 'supporto', label: 'Supporto Educativo', icon: '🎯' }
                            ].map((interest) => (
                              <button
                                key={interest.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, primaryInterest: interest.value }))}
                                className={`group w-full p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                                  formData.primaryInterest === interest.value
                                    ? 'border-white/50 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg'
                                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">{interest.icon}</span>
                                  <span className={`font-medium transition-colors duration-300 ${
                                    formData.primaryInterest === interest.value
                                      ? 'text-white'
                                      : 'text-white group-hover:text-blue-300'
                                  }`}>
                                    {interest.label}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {errors.submit && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                    <p className="text-red-400 text-sm">{errors.submit}</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={handleBack}
                    className="border-2 border-white/30 text-white px-8 py-3 rounded-full font-semibold backdrop-blur-sm hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
                  >
                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Indietro
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 hover:from-blue-600 hover:to-cyan-600"
                  >
                    Crea Profilo
                    <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>

                {currentStep === 2 && (
                  <p className="text-center text-white/60 text-sm mt-4">
                    Dopo la creazione del profilo, verrai reindirizzato alla tua dashboard personalizzata
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileCreation;
