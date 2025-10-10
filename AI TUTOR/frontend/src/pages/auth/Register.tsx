import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'tutor' | 'parent',
    first_name: '',
    last_name: '',
    school_level: '',
    bio: '',
    subjects: '',
    hourly_rate: '',
    phone: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email è richiesta';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }

    if (!formData.password) {
      newErrors.password = 'Password è richiesta';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password deve essere di almeno 8 caratteri';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non corrispondono';
    }

    if (!formData.first_name) {
      newErrors.first_name = 'Nome è richiesto';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Cognome è richiesto';
    }

    if (formData.role === 'tutor' && !formData.subjects) {
      newErrors.subjects = 'Materie sono richieste per i tutor';
    }

    if (formData.role === 'tutor' && formData.hourly_rate && isNaN(Number(formData.hourly_rate))) {
      newErrors.hourly_rate = 'Tariffa oraria deve essere un numero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const userData = {
        ...formData,
        hourly_rate: formData.hourly_rate ? Number(formData.hourly_rate) : undefined,
      };
      
      await register(userData);
      navigate('/login');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crea il tuo account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Oppure{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              accedi al tuo account esistente
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="label">
                Tipo di Account
              </label>
              <select
                id="role"
                name="role"
                className="input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">Studente</option>
                <option value="tutor">Tutor</option>
                <option value="parent">Genitore</option>
              </select>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="label">
                  Nome *
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  className={`input ${errors.first_name ? 'border-red-500' : ''}`}
                  value={formData.first_name}
                  onChange={handleChange}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="label">
                  Cognome *
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  className={`input ${errors.last_name ? 'border-red-500' : ''}`}
                  value={formData.last_name}
                  onChange={handleChange}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Telefono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {/* Password Fields */}
            <div>
              <label htmlFor="password" className="label">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Conferma Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <div>
                <label htmlFor="school_level" className="label">
                  Livello Scolastico
                </label>
                <select
                  id="school_level"
                  name="school_level"
                  className="input"
                  value={formData.school_level}
                  onChange={handleChange}
                >
                  <option value="">Seleziona livello</option>
                  <option value="elementari">Scuola Elementare</option>
                  <option value="medie">Scuola Media</option>
                  <option value="superiori">Scuola Superiore</option>
                  <option value="università">Università</option>
                </select>
              </div>
            )}

            {/* Tutor-specific fields */}
            {formData.role === 'tutor' && (
              <>
                <div>
                  <label htmlFor="subjects" className="label">
                    Materie (separate da virgola) *
                  </label>
                  <input
                    id="subjects"
                    name="subjects"
                    type="text"
                    className={`input ${errors.subjects ? 'border-red-500' : ''}`}
                    placeholder="es. Matematica, Fisica, Chimica"
                    value={formData.subjects}
                    onChange={handleChange}
                  />
                  {errors.subjects && (
                    <p className="mt-1 text-sm text-red-600">{errors.subjects}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="hourly_rate" className="label">
                    Tariffa Oraria (€)
                  </label>
                  <input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    min="0"
                    step="0.50"
                    className={`input ${errors.hourly_rate ? 'border-red-500' : ''}`}
                    value={formData.hourly_rate}
                    onChange={handleChange}
                  />
                  {errors.hourly_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.hourly_rate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bio" className="label">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    className="input"
                    placeholder="Descrivi la tua esperienza e specializzazioni"
                    value={formData.bio}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Registrati'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
