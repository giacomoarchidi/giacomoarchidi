import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔵 Starting login...');
      const response = await authApi.login(loginData);
      console.log('✅ Login response:', response);
      
      // Controlla se la risposta è valida
      if (!response || !response.access_token) {
        throw new Error('Risposta di login non valida');
      }
      
      // Salva il token
      localStorage.setItem('token', response.access_token);
      console.log('✅ Token saved');
      
      // Ottieni il profilo utente
      console.log('🔵 Fetching user profile...');
      const userProfile = await authApi.getProfile();
      console.log('✅ User profile received:', userProfile);
      
      // Converti il ruolo in stringa per essere sicuri
      const roleStr = String(userProfile.role).toLowerCase();
      console.log('✅ Role as string:', roleStr);
      
      // Redirect in base al ruolo
      if (roleStr === 'student') {
        console.log('➡️ Redirecting to STUDENT dashboard');
        navigate('/student/dashboard');
      } else if (roleStr === 'tutor') {
        console.log('➡️ Redirecting to TUTOR dashboard');
        navigate('/tutor/dashboard');
      } else if (roleStr === 'parent') {
        console.log('➡️ Redirecting to PARENT dashboard');
        navigate('/parent/dashboard');
      } else {
        console.log('❌ Unknown role:', roleStr);
        navigate('/');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error data:', err.response?.data);
      
      const errorMsg = err.response?.data?.detail || err.message || 'Errore durante il login';
      setError(errorMsg);
      
      // MOSTRA L'ERRORE IN UN ALERT
      alert('❌ ERRORE LOGIN:\n\n' + errorMsg + '\n\nGuarda la console per più dettagli');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Animated background elements - Blu futuristico */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-screen filter blur-3xl opacity-15 animate-pulse" style={{animationDelay: '4s'}}></div>
        {/* Linee di griglia futuristiche */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0066FF08_1px,transparent_1px),linear-gradient(to_bottom,#0066FF08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 mx-4 md:mx-8 mt-6 mb-4 bg-gradient-to-r from-slate-900/70 via-slate-900/60 to-slate-900/70 backdrop-blur-xl shadow-2xl shadow-blue-500/10 border border-blue-500/30 rounded-2xl hover:border-blue-400/50 transition-all duration-300 hover:shadow-blue-500/20">
        <div className="container mx-auto px-6 md:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-2 ring-blue-400/30 ring-offset-2 ring-offset-slate-900">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-cyan-300 transition-all duration-300">Tutor Platform</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-white/80 hover:text-blue-300 transition-all duration-300 hover:scale-105 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-blue-400 after:transition-all after:duration-300">Caratteristiche</a>
              <a href="#about" className="text-white/80 hover:text-blue-300 transition-all duration-300 hover:scale-105 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-blue-400 after:transition-all after:duration-300">Chi Siamo</a>
              <a href="#contact" className="text-white/80 hover:text-blue-300 transition-all duration-300 hover:scale-105 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-blue-400 after:transition-all after:duration-300">Contatti</a>
            </nav>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowLogin(true)}
                className="text-white/90 hover:text-white transition-all duration-300 hover:scale-105 font-medium px-5 py-2.5 rounded-xl hover:bg-blue-500/20 backdrop-blur-sm"
              >
                Login
              </button>
              <Link to="/create-profile" className="hidden sm:block text-white/90 hover:text-white transition-all duration-300 hover:scale-105 font-medium px-5 py-2.5 rounded-xl hover:bg-blue-500/20 backdrop-blur-sm">
                Registrati
              </Link>
              <Link to="/create-profile" className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transform hover:scale-105 transition-all duration-300 hover:from-blue-700 hover:to-cyan-600">
                Inizia Ora
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="inline-block mb-6 px-6 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full text-blue-300 text-sm font-semibold backdrop-blur-sm">
              🚀 Innovazione nell'Educazione
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-2xl">
              Il Futuro dell'Apprendimento con{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-pulse">
                Tutoring AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100/80 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
              Connettiamo studenti con tutor qualificati per un'esperienza di apprendimento 
              personalizzata e di alta qualità, potenziata dall'intelligenza artificiale di ultima generazione.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                to="/create-profile" 
                className="group relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-2xl shadow-blue-500/50 hover:shadow-blue-400/70 transform hover:scale-105 transition-all duration-300 hover:from-blue-700 hover:to-cyan-600 ring-2 ring-blue-400/50 ring-offset-2 ring-offset-slate-950 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700"
              >
                <span className="relative flex items-center justify-center space-x-2">
                  <span>Inizia Subito</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link 
                to="/learn-more" 
                className="group border-2 border-blue-400/50 text-white px-10 py-4 rounded-xl text-lg font-semibold backdrop-blur-sm hover:bg-blue-500/20 hover:border-blue-400 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/30"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Scopri di Più</span>
                  <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-gradient-to-b from-blue-950/30 to-transparent backdrop-blur-sm border-y border-blue-500/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Le Nostre <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Funzionalità</span>
            </h2>
            <p className="text-xl text-blue-100/70 max-w-3xl mx-auto">
              Una piattaforma completa e all'avanguardia per gestire lezioni, pagamenti e progressi degli studenti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-blue-950/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-blue-500/20 hover:border-blue-400/60 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">Lezioni Online</h3>
              <p className="text-blue-100/70 group-hover:text-blue-100/90 transition-colors duration-300">
                Sessioni di tutoring interattive con video HD, lavagna condivisa e strumenti di collaborazione avanzati.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-cyan-950/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-cyan-500/20 hover:border-cyan-400/60 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-cyan-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">Progressi Tracciati</h3>
              <p className="text-blue-100/70 group-hover:text-blue-100/90 transition-colors duration-300">
                Monitora i progressi degli studenti con report dettagliati, analisi AI e feedback personalizzati in tempo reale.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-blue-900/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-blue-400/20 hover:border-blue-300/60 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-400/30">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-400/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">Pagamenti Sicuri</h3>
              <p className="text-blue-100/70 group-hover:text-blue-100/90 transition-colors duration-300">
                Sistema di pagamento integrato con Stripe per transazioni sicure, affidabili e gestione automatica delle fatture.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gradient-to-br from-indigo-950/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-indigo-500/20 hover:border-indigo-400/60 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-indigo-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-indigo-300 transition-colors duration-300">AI-Powered</h3>
              <p className="text-blue-100/70 group-hover:text-blue-100/90 transition-colors duration-300">
                Intelligenza artificiale avanzata per generare appunti delle lezioni, report personalizzati e analisi predittive.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-gradient-to-br from-sky-950/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-sky-500/20 hover:border-sky-400/60 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/30">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-sky-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-sky-300 transition-colors duration-300">Community</h3>
              <p className="text-blue-100/70 group-hover:text-blue-100/90 transition-colors duration-300">
                Una comunità globale di tutor qualificati e studenti motivati per un apprendimento collaborativo ed efficace.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-gradient-to-br from-blue-900/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-blue-400/20 hover:border-blue-300/60 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-400/30">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">Veloce e Affidabile</h3>
              <p className="text-blue-100/70 group-hover:text-blue-100/90 transition-colors duration-300">
                Piattaforma ottimizzata per performance elevate, disponibilità 99.9% e un'esperienza utente fluida e reattiva.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="group transform hover:scale-110 transition-all duration-300 bg-gradient-to-br from-blue-500/10 to-transparent p-6 rounded-2xl border border-blue-500/20 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/20">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">1000+</div>
              <div className="text-blue-200/70 group-hover:text-blue-100 transition-colors duration-300 font-medium">Studenti Attivi</div>
            </div>
            <div className="group transform hover:scale-110 transition-all duration-300 bg-gradient-to-br from-cyan-500/10 to-transparent p-6 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/20">
              <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">200+</div>
              <div className="text-blue-200/70 group-hover:text-blue-100 transition-colors duration-300 font-medium">Tutor Qualificati</div>
            </div>
            <div className="group transform hover:scale-110 transition-all duration-300 bg-gradient-to-br from-sky-500/10 to-transparent p-6 rounded-2xl border border-sky-500/20 hover:border-sky-400/50 hover:shadow-xl hover:shadow-sky-500/20">
              <div className="text-5xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-2">5000+</div>
              <div className="text-blue-200/70 group-hover:text-blue-100 transition-colors duration-300 font-medium">Lezioni Completate</div>
            </div>
            <div className="group transform hover:scale-110 transition-all duration-300 bg-gradient-to-br from-indigo-500/10 to-transparent p-6 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/20">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">98%</div>
              <div className="text-blue-200/70 group-hover:text-blue-100 transition-colors duration-300 font-medium">Soddisfazione Clienti</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-24 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                La Nostra <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Missione</span>
              </h2>
              <p className="text-lg text-blue-100/80 mb-6 leading-relaxed">
                Crediamo che l'istruzione di qualità dovrebbe essere accessibile a tutti. La nostra piattaforma 
                connette studenti con tutor esperti per creare un'esperienza di apprendimento personalizzata e coinvolgente.
              </p>
              <p className="text-lg text-blue-100/80 mb-10 leading-relaxed">
                Utilizziamo tecnologie all'avanguardia, inclusa l'intelligenza artificiale, per migliorare 
                l'efficacia dell'insegnamento e tracciare i progressi degli studenti in tempo reale.
              </p>
              <Link 
                to="/create-profile" 
                className="group inline-flex items-center bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transform hover:scale-105 transition-all duration-300 hover:from-blue-700 hover:to-cyan-600 ring-2 ring-blue-400/50"
              >
                <span>Unisciti a Noi</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-blue-600/20 backdrop-blur-md rounded-3xl p-8 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/50 transform hover:rotate-12 hover:scale-110 transition-transform duration-300 ring-4 ring-blue-400/30">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Insegnamento di Qualità</h3>
                  <p className="text-blue-100/80 leading-relaxed">
                    Tutor certificati e materie di studio complete per garantire il miglior apprendimento possibile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative z-10 bg-slate-950/80 backdrop-blur-xl py-16 border-t border-blue-500/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <span className="text-white font-bold text-lg">AI</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Tutor Platform</span>
              </div>
              <p className="text-blue-200/70 leading-relaxed">
                La piattaforma di tutoring online più avanzata con tecnologia AI per un'esperienza di apprendimento rivoluzionaria.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Servizi</h4>
              <ul className="space-y-3 text-blue-200/70">
                <li><a href="#" className="hover:text-blue-300 transition-all duration-300 hover:translate-x-1 transform inline-block hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Lezioni Private</a></li>
                <li><a href="#" className="hover:text-blue-300 transition-all duration-300 hover:translate-x-1 transform inline-block hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Gruppi di Studio</a></li>
                <li><a href="#" className="hover:text-blue-300 transition-all duration-300 hover:translate-x-1 transform inline-block hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Preparazione Esami</a></li>
                <li><a href="#" className="hover:text-blue-300 transition-all duration-300 hover:translate-x-1 transform inline-block hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Supporto AI</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Supporto</h4>
              <ul className="space-y-3 text-blue-200/70">
                <li><a href="#" className="hover:text-blue-300 transition-all duration-300 hover:translate-x-1 transform inline-block hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Centro Aiuto</a></li>
                <li><a href="#" className="hover:text-blue-300 transition-all duration-300 hover:translate-x-1 transform inline-block hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Contattaci</a></li>
                <li><a href="#" className="hover:text-blue-300 transition-all duration-300 hover:translate-x-1 transform inline-block hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-300 transition-all duration-300 hover:translate-x-1 transform inline-block hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Tutorial</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Contatti</h4>
              <ul className="space-y-3 text-blue-200/70">
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>info@aitutor.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+39 123 456 789</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Via Roma 123, Milano</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-500/20 mt-12 pt-8 text-center text-blue-200/70">
            <p>&copy; 2024 AI Tutor Platform. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl shadow-2xl shadow-blue-500/20 border border-blue-500/30 p-8 w-full max-w-md transform transition-all duration-300 scale-100 animate-in zoom-in-95">
            {/* Close button */}
            <button
              onClick={() => {
                setShowLogin(false);
                setError('');
                setLoginData({ email: '', password: '' });
              }}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors duration-200 hover:bg-blue-500/20 rounded-lg p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50 mx-auto mb-4 ring-2 ring-blue-400/30">
                <span className="text-white font-bold text-2xl">AI</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">Benvenuto!</h2>
              <p className="text-blue-200/70">Accedi al tuo account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl backdrop-blur-sm">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-blue-950/30 border border-blue-500/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                  placeholder="tua@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-blue-950/30 border border-blue-500/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ring-2 ring-blue-400/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Accesso in corso...
                  </span>
                ) : (
                  'Accedi'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-blue-200/60">
                Non hai un account?{' '}
                <Link 
                  to="/create-profile" 
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                  onClick={() => setShowLogin(false)}
                >
                  Registrati ora
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;