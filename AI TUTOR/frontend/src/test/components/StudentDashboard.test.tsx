import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import StudentDashboard from '../../pages/student/StudentDashboard'

// Mock API calls
const mockLessonsApi = {
  getLessons: vi.fn(),
}

vi.mock('../../api/lessons', () => ({
  lessonsApi: mockLessonsApi,
}))

describe('StudentDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.user = {
      id: 1,
      email: 'student@test.com',
      role: 'student',
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
    }
    mockAuthStore.isAuthenticated = true
  })

  it('renders welcome message with user name', () => {
    render(<StudentDashboard />)
    
    expect(screen.getByText('Benvenuto, John!')).toBeInTheDocument()
  })

  it('renders quick action cards', () => {
    render(<StudentDashboard />)
    
    expect(screen.getByText('Lezioni')).toBeInTheDocument()
    expect(screen.getByText('Compiti')).toBeInTheDocument()
    expect(screen.getByText('Profilo')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    mockLessonsApi.getLessons.mockImplementation(() => new Promise(() => {}))
    
    render(<StudentDashboard />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays upcoming lessons', async () => {
    const mockLessons = {
      data: [
        {
          id: 1,
          subject: 'Matematica',
          start_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          status: 'confirmed',
          room_slug: 'test-room',
        },
      ],
    }
    
    mockLessonsApi.getLessons.mockResolvedValue(mockLessons)
    
    render(<StudentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Prossime Lezioni')).toBeInTheDocument()
      expect(screen.getByText('Matematica')).toBeInTheDocument()
    })
  })

  it('displays recent lessons', async () => {
    const mockLessons = {
      data: [
        {
          id: 2,
          subject: 'Fisica',
          start_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          status: 'completed',
          notes_text: 'Lezione completata',
        },
      ],
    }
    
    mockLessonsApi.getLessons.mockResolvedValue(mockLessons)
    
    render(<StudentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Lezioni Recenti')).toBeInTheDocument()
      expect(screen.getByText('Fisica')).toBeInTheDocument()
    })
  })

  it('shows empty state when no lessons', async () => {
    mockLessonsApi.getLessons.mockResolvedValue({ data: [] })
    
    render(<StudentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Nessuna lezione in programma')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockLessonsApi.getLessons.mockRejectedValue(new Error('API Error'))
    
    render(<StudentDashboard />)
    
    await waitFor(() => {
      // Should not crash, just show empty states
      expect(screen.getByText('Prossime Lezioni')).toBeInTheDocument()
    })
  })
})
