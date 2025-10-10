import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'student':
        return '/student/dashboard';
      case 'tutor':
        return '/tutor/dashboard';
      case 'parent':
        return '/parent/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const getRoleDisplayName = () => {
    if (!user) return '';
    switch (user.role) {
      case 'student':
        return 'Studente';
      case 'tutor':
        return 'Tutor';
      case 'parent':
        return 'Genitore';
      case 'admin':
        return 'Amministratore';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Navigation */}
      {isAuthenticated && (
        <nav className="bg-slate-900/80 backdrop-blur-xl shadow-2xl border-b border-blue-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to={getDashboardPath()} className="flex items-center group">
                  <div className="flex-shrink-0 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
                      <span className="text-white font-bold text-lg">AI</span>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-cyan-300 transition-all duration-300">
                      Tutoring Platform
                    </h1>
                  </div>
                </Link>
                
                {/* Navigation Links */}
                <div className="hidden md:ml-10 md:flex md:space-x-2">
                  <Link
                    to={getDashboardPath()}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      location.pathname === getDashboardPath()
                        ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/50'
                        : 'text-blue-200 hover:text-white hover:bg-blue-500/20'
                    }`}
                  >
                    Dashboard
                  </Link>
                  
                  {user?.role === 'student' && (
                    <>
                      <Link
                        to="/student/lessons"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          location.pathname.startsWith('/student/lessons')
                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/50'
                            : 'text-blue-200 hover:text-white hover:bg-blue-500/20'
                        }`}
                      >
                        Lezioni
                      </Link>
                      <Link
                        to="/student/assignments"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          location.pathname.startsWith('/student/assignments')
                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/50'
                            : 'text-blue-200 hover:text-white hover:bg-blue-500/20'
                        }`}
                      >
                        Compiti
                      </Link>
                    </>
                  )}
                  
                  {user?.role === 'tutor' && (
                    <>
                      <Link
                        to="/tutor/lessons"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          location.pathname.startsWith('/tutor/lessons')
                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/50'
                            : 'text-blue-200 hover:text-white hover:bg-blue-500/20'
                        }`}
                      >
                        Lezioni
                      </Link>
                      <Link
                        to="/tutor/availability"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          location.pathname.startsWith('/tutor/availability')
                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/50'
                            : 'text-blue-200 hover:text-white hover:bg-blue-500/20'
                        }`}
                      >
                        Disponibilità
                      </Link>
                      <Link
                        to="/tutor/students"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          location.pathname.startsWith('/tutor/students')
                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/50'
                            : 'text-blue-200 hover:text-white hover:bg-blue-500/20'
                        }`}
                      >
                        Studenti
                      </Link>
                    </>
                  )}
                  
                  {user?.role === 'parent' && (
                    <>
                      <Link
                        to="/parent/children"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          location.pathname.startsWith('/parent/children')
                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/50'
                            : 'text-blue-200 hover:text-white hover:bg-blue-500/20'
                        }`}
                      >
                        Figli
                      </Link>
                      <Link
                        to="/parent/reports"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          location.pathname.startsWith('/parent/reports')
                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/50'
                            : 'text-blue-200 hover:text-white hover:bg-blue-500/20'
                        }`}
                      >
                        Report
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium text-white">{user?.first_name} {user?.last_name}</div>
                  <div className="text-blue-300 text-xs">{getRoleDisplayName()}</div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-blue-200 hover:text-white border-2 border-blue-500/30 hover:border-blue-400 rounded-lg transition-all duration-300 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
