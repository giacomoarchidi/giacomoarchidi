import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { availabilityApi } from '../../api/availability';
import type { AvailabilitySlot } from '../../api/availability';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const AvailabilityPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Aggiungi stili CSS per i time picker
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Stili per il time picker */
      input[type="time"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
        border-radius: 4px;
        padding: 4px;
      }
      
      input[type="time"]::-webkit-calendar-picker-indicator:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      /* Per Firefox */
      input[type="time"] {
        -moz-appearance: textfield;
      }
      
      input[type="time"]::-moz-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
      }
      
      /* Stili per la tendina del time picker */
      input[type="time"]::-webkit-datetime-edit-text {
        color: white;
        font-weight: bold;
      }
      
      input[type="time"]::-webkit-datetime-edit-hour-field,
      input[type="time"]::-webkit-datetime-edit-minute-field,
      input[type="time"]::-webkit-datetime-edit-second-field {
        color: white;
        font-weight: bold;
        background-color: transparent;
      }
      
      /* Stili per la tendina del time picker - più scura */
      input[type="time"]::-webkit-calendar-picker-indicator {
        filter: invert(1) brightness(0.8);
        cursor: pointer;
        border-radius: 4px;
        padding: 4px;
        background-color: rgba(0, 0, 0, 0.3);
      }
      
      input[type="time"]::-webkit-calendar-picker-indicator:hover {
        background-color: rgba(0, 0, 0, 0.5);
        transform: scale(1.1);
        transition: all 0.2s ease;
      }
      
      /* Stili per il popup del time picker */
      input[type="time"]::-webkit-calendar-picker-indicator:active {
        background-color: rgba(0, 0, 0, 0.7);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Helper function per convertire il nome del giorno in numero
  const getWeekdayNumber = (day: string): number => {
    const days: { [key: string]: number } = {
      'Lunedì': 0,
      'Martedì': 1,
      'Mercoledì': 2,
      'Giovedì': 3,
      'Venerdì': 4,
      'Sabato': 5,
      'Domenica': 6
    };
    return days[day] || 0;
  };

  // Helper function per convertire il numero del giorno in nome
  const getWeekdayName = (weekday: number): string => {
    const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    return days[weekday] || 'Lunedì';
  };

  // Carica la disponibilità dal backend
  const loadAvailability = async () => {
    try {
      setLoading(true);
      const backendAvailability = await availabilityApi.getAvailability();
      console.log('Disponibilità caricate dal backend:', backendAvailability);
      
      // Converti i dati del backend nel formato frontend
      const updatedSlots = defaultTimeSlots.map(slot => {
        const backendSlot = backendAvailability.find(a => a.weekday === getWeekdayNumber(slot.day));
        if (backendSlot) {
          return {
            ...slot,
            startTime: backendSlot.start_time,
            endTime: backendSlot.end_time,
            isAvailable: backendSlot.is_available
          };
        }
        return slot;
      });
      
      setTimeSlots(updatedSlots);
    } catch (error) {
      console.error('Errore nel caricamento disponibilità:', error);
      // Continua con i dati di default se c'è un errore
      setTimeSlots(defaultTimeSlots);
    } finally {
      setLoading(false);
    }
  };

  // Dati di default
  const defaultTimeSlots: TimeSlot[] = [
    { id: '1', day: 'Lunedì', startTime: '09:00', endTime: '17:00', isAvailable: false },
    { id: '2', day: 'Martedì', startTime: '09:00', endTime: '17:00', isAvailable: false },
    { id: '3', day: 'Mercoledì', startTime: '09:00', endTime: '17:00', isAvailable: false },
    { id: '4', day: 'Giovedì', startTime: '09:00', endTime: '17:00', isAvailable: false },
    { id: '5', day: 'Venerdì', startTime: '09:00', endTime: '17:00', isAvailable: false },
    { id: '6', day: 'Sabato', startTime: '09:00', endTime: '13:00', isAvailable: false },
    { id: '7', day: 'Domenica', startTime: '10:00', endTime: '14:00', isAvailable: false },
  ];

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(defaultTimeSlots);

  // Carica la disponibilità quando il componente si monta
  useEffect(() => {
    loadAvailability();
  }, []);

  const toggleAvailability = (id: string) => {
    setTimeSlots(prev => 
      prev.map(slot => 
        slot.id === id ? { ...slot, isAvailable: !slot.isAvailable } : slot
      )
    );
  };

  const updateTimeSlot = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setTimeSlots(prev => 
      prev.map(slot => 
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
    
    // Aggiungi un effetto visivo di conferma
    const input = document.querySelector(`input[data-slot-id="${id}"][data-field="${field}"]`) as HTMLElement;
    if (input) {
      input.style.transform = 'scale(1.05)';
      input.style.boxShadow = '0 0 20px rgba(147, 51, 234, 0.5)';
      setTimeout(() => {
        input.style.transform = 'scale(1)';
        input.style.boxShadow = '';
      }, 200);
    }
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      console.log('Salvando disponibilità:', timeSlots);
      
      // Converti i dati frontend nel formato backend
      const backendAvailability: AvailabilitySlot[] = timeSlots.map(slot => ({
        weekday: getWeekdayNumber(slot.day),
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: slot.isAvailable
      }));
      
      await availabilityApi.saveAvailability(backendAvailability);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio della disponibilità. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/tutor/dashboard');
  };

  const getDayIcon = (day: string) => {
    const icons: { [key: string]: string } = {
      'Lunedì': '📅',
      'Martedì': '📅',
      'Mercoledì': '📅',
      'Giovedì': '📅',
      'Venerdì': '📅',
      'Sabato': '📅',
      'Domenica': '📅',
    };
    return icons[day] || '📅';
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
          
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
              <div className="text-4xl">⏰</div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Gestisci Disponibilità</h1>
              <p className="text-white/70 text-lg">Imposta i tuoi orari di lavoro per ricevere prenotazioni</p>
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Orari Settimanali</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="text-white/70">Caricamento disponibilità...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
            {timeSlots.map((slot) => (
              <div 
                key={slot.id} 
                className={`p-6 rounded-2xl border transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl ${
                  slot.isAvailable 
                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-green-400/50 shadow-cyan-500/20' 
                    : 'bg-gradient-to-br from-white/5 to-white/10 border-white/20 hover:border-white/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getDayIcon(slot.day)}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">{slot.day}</h3>
                      <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6 mt-4">
                        <div className="flex flex-col space-y-2">
                          <label className="text-white/80 text-sm font-medium flex items-center space-x-2">
                            <span className="text-lg">🕐</span>
                            <span>Orario Inizio</span>
                          </label>
                          <div className="relative group">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
                              data-slot-id={slot.id}
                              data-field="startTime"
                              className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-2 border-gray-600/50 rounded-xl pl-4 pr-12 py-3 text-white font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400/60 transition-all duration-300 hover:border-gray-500/70 shadow-lg backdrop-blur-sm w-full lg:w-40 group-hover:shadow-blue-500/25"
                              style={{
                                colorScheme: 'dark',
                                backgroundColor: '#1f2937'
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-500/10 rounded-xl pointer-events-none group-hover:from-blue-500/20 group-hover:to-blue-500/20 transition-all duration-300"></div>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center lg:mt-8">
                          <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-blue-400"></div>
                          <div className="mx-2 text-white/60 font-bold text-xl">→</div>
                          <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <label className="text-white/80 text-sm font-medium flex items-center space-x-2">
                            <span className="text-lg">🕕</span>
                            <span>Orario Fine</span>
                          </label>
                          <div className="relative group">
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateTimeSlot(slot.id, 'endTime', e.target.value)}
                              data-slot-id={slot.id}
                              data-field="endTime"
                              className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-2 border-gray-600/50 rounded-xl pl-4 pr-12 py-3 text-white font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400/60 transition-all duration-300 hover:border-gray-500/70 shadow-lg backdrop-blur-sm w-full lg:w-40 group-hover:shadow-blue-500/25"
                              style={{
                                colorScheme: 'dark',
                                backgroundColor: '#1f2937'
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl pointer-events-none group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300"></div>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleAvailability(slot.id)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      slot.isAvailable
                        ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    {slot.isAvailable ? '✅ Disponibile' : '❌ Non Disponibile'}
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Riepilogo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-cyan-500/20 rounded-2xl border border-green-400/50">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-white">
                {timeSlots.filter(slot => slot.isAvailable).length}
              </div>
              <div className="text-white/70">Giorni Disponibili</div>
            </div>
            <div className="text-center p-6 bg-blue-500/20 rounded-2xl border border-blue-400/50">
              <div className="text-3xl mb-2">⏰</div>
              <div className="text-2xl font-bold text-white">
                {timeSlots.filter(slot => slot.isAvailable).reduce((total, slot) => {
                  const [startHour, startMin] = slot.startTime.split(':').map(Number);
                  const [endHour, endMin] = slot.endTime.split(':').map(Number);
                  const startMinutes = startHour * 60 + startMin;
                  const endMinutes = endHour * 60 + endMin;
                  return total + (endMinutes - startMinutes) / 60;
                }, 0).toFixed(1)}
              </div>
              <div className="text-white/70">Ore Totali</div>
            </div>
            <div className="text-center p-6 bg-blue-500/20 rounded-2xl border border-blue-400/50">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-2xl font-bold text-white">7</div>
              <div className="text-white/70">Giorni Settimana</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={saveAvailability}
            disabled={saving || loading}
            className={`px-8 py-4 font-bold rounded-xl transition-all duration-300 shadow-lg ${
              saving || loading
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105'
            }`}
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Salvando...</span>
              </div>
            ) : (
              '💾 Salva Disponibilità'
            )}
          </button>
          
          <Link
            to="/tutor/dashboard"
            className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            🔙 Torna alla Dashboard
          </Link>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg rounded-3xl border border-green-400/30 p-8 max-w-md w-full transform animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4">
                ✅ Disponibilità Salvata!
              </h3>
              
              {/* Message */}
              <p className="text-white/80 mb-6 leading-relaxed">
                I tuoi orari di disponibilità sono stati aggiornati con successo. 
                Gli studenti potranno ora prenotare lezioni nei tuoi orari disponibili.
              </p>
              
              {/* Stats */}
              <div className="bg-white/10 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center text-white">
                  <span className="text-white/70">Giorni attivi:</span>
                  <span className="font-bold text-green-400">
                    {timeSlots.filter(slot => slot.isAvailable).length} / 7
                  </span>
                </div>
                <div className="flex justify-between items-center text-white mt-2">
                  <span className="text-white/70">Ore totali:</span>
                  <span className="font-bold text-blue-400">
                    {timeSlots.filter(slot => slot.isAvailable).reduce((total, slot) => {
                      const [startHour, startMin] = slot.startTime.split(':').map(Number);
                      const [endHour, endMin] = slot.endTime.split(':').map(Number);
                      const startMinutes = startHour * 60 + startMin;
                      const endMinutes = endHour * 60 + endMin;
                      return total + (endMinutes - startMinutes) / 60;
                    }, 0).toFixed(1)}h
                  </span>
                </div>
              </div>
              
              {/* Button */}
              <button
                onClick={handleSuccessModalClose}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 px-6 rounded-xl hover:from-cyan-600 hover:from-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🚀 Torna alla Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityPage;
