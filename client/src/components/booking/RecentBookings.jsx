import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import Spinner from '../ui/Spinner.jsx';
import { formatDisplayDate, formatTimestamp } from '../../utils/dates.js';
import { formatINR } from '../../utils/format.js';

/**
 * Latest bookings with a cancel action. Cancelling releases the room's
 * nights on the server, which is how "cancelled bookings block nothing"
 * becomes visible on the availability screen.
 */
export default function RecentBookings({ bookings, loading, error, cancellingId, cancelError, onCancel, onRefresh }) {
  const handleCancel = (booking) => {
    const ok = window.confirm(
      `Cancel the booking for ${booking.guestName} in room ${booking.room?.roomNumber} (${formatDisplayDate(booking.checkIn)} → ${formatDisplayDate(booking.checkOut)})?\n\nThe room will become available again for these dates.`
    );
    if (ok) onCancel(booking.id);
  };

  if (error) {
    return (
      <Alert tone="error" title="Could not load bookings" action={<Button variant="secondary" size="sm" onClick={onRefresh}>Try again</Button>}>
        {error.message}
      </Alert>
    );
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
        <Spinner className="h-4 w-4" /> Loading bookings…
      </div>
    );
  }

  if (bookings.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No bookings yet. Confirmed bookings will appear here.</p>;
  }

  return (
    <div className="space-y-3">
      {cancelError && (
        <Alert tone="error" title="Could not cancel booking">
          {cancelError.message}
        </Alert>
      )}
      <div className="-mx-5 overflow-x-auto px-5">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-[11px] uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-2 pr-4 font-semibold">Guest</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Room</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Stay</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-right">Total</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Booked</th>
              <th scope="col" className="py-2 font-semibold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {bookings.map((b) => {
              const cancelled = b.status === 'cancelled';
              return (
                <tr key={b.id} className={cancelled ? 'text-slate-400' : 'text-slate-800'}>
                  <td className="py-3 pr-4">
                    <p className="font-medium">{b.guestName}</p>
                    <p className="text-xs text-slate-500">{b.phone}</p>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {b.room?.roomNumber ?? '—'}
                    <span className="block text-xs text-slate-500">{b.room?.category}</span>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {formatDisplayDate(b.checkIn)} → {formatDisplayDate(b.checkOut)}
                    <span className="block text-xs text-slate-500">{b.nights} night{b.nights === 1 ? '' : 's'}</span>
                  </td>
                  <td className="py-3 pr-4 text-right font-medium whitespace-nowrap">{formatINR(b.totalPrice)}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={cancelled ? 'neutral' : 'success'}>{b.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-500 whitespace-nowrap">{formatTimestamp(b.createdAt)}</td>
                  <td className="py-3 text-right">
                    {!cancelled && (
                      <Button variant="danger" size="sm" loading={cancellingId === b.id} onClick={() => handleCancel(b)}>
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
