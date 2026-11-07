import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchForm from './SearchForm.jsx';

const categories = [
  { name: 'Standard', pricePerNight: 3500 },
  { name: 'Deluxe', pricePerNight: 5500 },
  { name: 'Premium', pricePerNight: 8500 },
  { name: 'Suite', pricePerNight: 12000 },
];
const initial = { checkIn: '2026-11-20', checkOut: '2026-11-22', category: '' };

function setup(overrides = {}) {
  const onSearch = vi.fn();
  render(
    <SearchForm initialValues={initial} categories={categories} categoriesLoading={false} loading={false} onSearch={onSearch} {...overrides} />
  );
  return { onSearch };
}

describe('SearchForm', () => {
  it('renders dates, categories with their rates, and a search button', () => {
    setup();
    expect(screen.getByLabelText(/check-in date/i)).toHaveValue('2026-11-20');
    expect(screen.getByLabelText(/check-out date/i)).toHaveValue('2026-11-22');
    expect(screen.getByText('2 nights')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Deluxe · ₹5,500\/night/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search availability/i })).toBeEnabled();
  });

  it('marks the date fields as required with a decorative asterisk', () => {
    setup();
    expect(screen.getByLabelText(/check-in date/i)).toBeRequired();
    expect(screen.getByLabelText(/check-out date/i)).toBeRequired();
    expect(screen.getByLabelText(/room category/i)).not.toBeRequired();
    expect(screen.getAllByText('*')).toHaveLength(2);
    screen.getAllByText('*').forEach((star) => expect(star).toHaveAttribute('aria-hidden', 'true'));
  });

  it('submits the chosen dates and category name', () => {
    const { onSearch } = setup();
    fireEvent.change(screen.getByLabelText(/room category/i), { target: { value: 'Suite' } });
    fireEvent.click(screen.getByRole('button', { name: /search availability/i }));
    expect(onSearch).toHaveBeenCalledWith({ checkIn: '2026-11-20', checkOut: '2026-11-22', category: 'Suite' });
  });

  it('moves check-out forward when check-in is set on or after it', () => {
    setup();
    fireEvent.change(screen.getByLabelText(/check-in date/i), { target: { value: '2026-11-25' } });
    expect(screen.getByLabelText(/check-out date/i)).toHaveValue('2026-11-26');
  });

  it('shows a validation error and does not search when check-out is not after check-in', () => {
    const { onSearch } = setup();
    fireEvent.change(screen.getByLabelText(/check-out date/i), { target: { value: '2026-11-20' } });
    fireEvent.click(screen.getByRole('button', { name: /search availability/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/after check-in/i);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('shows the loading state while a search is in progress', () => {
    setup({ loading: true });
    const button = screen.getByRole('button', { name: /searching/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
