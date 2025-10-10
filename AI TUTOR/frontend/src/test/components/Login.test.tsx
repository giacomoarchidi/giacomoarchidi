import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import Login from '../../pages/auth/Login'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(<Login />)
    
    expect(screen.getByText('Accedi al tuo account')).toBeInTheDocument()
    expect(screen.getByLabelText('Indirizzo Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accedi' })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<Login />)
    
    const submitButton = screen.getByRole('button', { name: 'Accedi' })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email è richiesta')).toBeInTheDocument()
      expect(screen.getByText('Password è richiesta')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    render(<Login />)
    
    const emailInput = screen.getByLabelText('Indirizzo Email')
    const submitButton = screen.getByRole('button', { name: 'Accedi' })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email non valida')).toBeInTheDocument()
    })
  })

  it('calls login function with correct data', async () => {
    const mockLogin = vi.fn()
    mockAuthStore.login = mockLogin
    
    render(<Login />)
    
    const emailInput = screen.getByLabelText('Indirizzo Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Accedi' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows error message when login fails', async () => {
    mockAuthStore.error = 'Invalid credentials'
    mockAuthStore.isAuthenticated = false
    
    render(<Login />)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows loading state during login', () => {
    mockAuthStore.isLoading = true
    
    render(<Login />)
    
    expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument()
  })

  it('has link to register page', () => {
    render(<Login />)
    
    const registerLink = screen.getByRole('link', { name: /registrati per un nuovo account/i })
    expect(registerLink).toHaveAttribute('href', '/register')
  })
})
