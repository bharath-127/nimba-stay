import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from './Header.jsx';

afterEach(() => vi.unstubAllEnvs());

describe('Header', () => {
  it('shows the page title and subtitle', () => {
    render(<Header />);
    expect(screen.getByRole('heading', { level: 1, name: 'Front Desk Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Room availability, bookings and maintenance management')).toBeInTheDocument();
  });

  it('has a notifications button', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('shows the staff chip from VITE_STAFF_NAME with initials', () => {
    vi.stubEnv('VITE_STAFF_NAME', 'Asha Rao');
    render(<Header />);
    expect(screen.getByLabelText('Signed in as Asha Rao')).toHaveTextContent('AR');
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Front Desk')).toBeInTheDocument();
  });

  it('falls back to "Front Desk" when no staff name is configured', () => {
    vi.stubEnv('VITE_STAFF_NAME', '');
    render(<Header />);
    expect(screen.getByLabelText('Signed in as Front Desk')).toHaveTextContent('FD');
  });

  it('has no API status indicator', () => {
    render(<Header />);
    expect(screen.queryByText(/API online|API offline|Database offline/)).not.toBeInTheDocument();
  });
});
