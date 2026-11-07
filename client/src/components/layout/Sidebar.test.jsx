import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Sidebar from './Sidebar.jsx';

describe('Sidebar', () => {
  it('renders the brand and the primary navigation with section anchors', () => {
    render(<Sidebar />);
    expect(screen.getByText('Nimba Stay')).toBeInTheDocument();
    const nav = within(screen.getByRole('navigation', { name: /primary/i }));
    expect(nav.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '#top');
    expect(nav.getByRole('link', { name: /availability/i })).toHaveAttribute('href', '#availability');
    expect(nav.getByRole('link', { name: /bookings/i })).toHaveAttribute('href', '#bookings');
    expect(nav.getByRole('link', { name: /maintenance/i })).toHaveAttribute('href', '#maintenance');
    expect(nav.getAllByRole('link')).toHaveLength(4);
  });

  it('marks Dashboard as the current page by default', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /bookings/i })).not.toHaveAttribute('aria-current');
  });

  it('has no Reports entry', () => {
    render(<Sidebar />);
    expect(screen.queryByText(/reports/i)).not.toBeInTheDocument();
  });
});
