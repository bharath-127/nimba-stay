import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ApiError } from '../../services/api.js';

vi.mock('../../services/roomService.js', () => ({ getHealth: vi.fn() }));

const { getHealth } = await import('../../services/roomService.js');
const { default: Header } = await import('./Header.jsx');

// Each test resets the mock in its own body. Clearing a mock that will
// return rejected promises from inside a beforeEach hook made this Vitest
// version report the rejection as unhandled, even though useHealth catches
// it (verified with isolated probes). Resetting in the test body avoids it.
function mockHealth(impl) {
  getHealth.mockClear();
  getHealth.mockImplementation(impl);
}
const ok = (transactions = 'fallback') => () => Promise.resolve({ status: 'ok', database: 'connected', transactions });
const fail = (status, message) => () =>
  Promise.reject(new ApiError({ status, code: status === 503 ? 'DATABASE_UNAVAILABLE' : 'NETWORK_ERROR', message }));

describe('Header API status indicator', () => {
  it('shows "API online" when /api/health returns 200', async () => {
    mockHealth(ok());
    render(<Header />);
    expect(await screen.findByRole('button', { name: /^API online/ })).toBeInTheDocument();
  });

  it('shows "Database offline" when /api/health returns 503', async () => {
    mockHealth(fail(503, 'The API is running but cannot reach the database'));
    render(<Header />);
    expect(await screen.findByRole('button', { name: /^Database offline/ })).toBeInTheDocument();
  });

  it('shows "API offline" when the server cannot be reached', async () => {
    mockHealth(fail(0, 'Cannot reach the server'));
    render(<Header />);
    expect(await screen.findByRole('button', { name: /^API offline/ })).toBeInTheDocument();
  });

  it('re-checks when clicked and reflects recovery', async () => {
    let calls = 0;
    mockHealth(() => (calls++ === 0 ? fail(0, 'down')() : ok('enabled')()));
    render(<Header />);
    fireEvent.click(await screen.findByRole('button', { name: /^API offline/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^API online/ })).toBeInTheDocument());
    expect(getHealth).toHaveBeenCalledTimes(2);
  });

  it('polls the backend on an interval', async () => {
    vi.useFakeTimers();
    try {
      mockHealth(ok());
      render(<Header />);
      expect(getHealth).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(15_000);
      expect(getHealth).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
