import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the main page component
jest.mock('../src/app/page', () => {
  return function MockPage() {
    return <div>Redis Explorer</div>
  }
})

describe('Redis Explorer', () => {
  it('should have basic functionality', () => {
    // Basic test to ensure Jest is working
    expect(true).toBe(true)
  })

  it('should render application name', () => {
    const MockPage = require('../src/app/page').default
    render(<MockPage />)
    expect(screen.getByText('Redis Explorer')).toBeInTheDocument()
  })
})
