import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Alert from '../ui/Alert.jsx';
import Spinner from '../ui/Spinner.jsx';
import { formatDisplayDate, todayIso } from '../../utils/dates.js';

/** Two-step lift, so a block is never removed by a stray click. */
function LiftAction({ block, busy, onLift }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setConfirming(true)} aria-label={`Lift block on room ${block.room?.roomNumber}`}>
        Lift
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2" role="group" aria-label={`Confirm lifting the block on room ${block.room?.roomNumber}`}>
      <span className="text-xs text-slate-500">Back in service?</span>
      <Button variant="primary" size="sm" loading={busy} onClick={() => onLift(block.id)}>
        Yes, lift
      </Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </div>
  );
}

function BlockForm({ rooms, creating, onCreate }) {
  const today = todayIso();
  const [values, setValues] = useState({ roomId: '', startDate: today, endDate: '', reason: 'Maintenance' });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);

  const update = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.roomId) next.roomId = 'Choose a room';
    if (!values.startDate) next.startDate = 'Choose a start date';
    if (values.endDate && values.startDate && values.endDate <= values.startDate) next.endDate = 'End date must be after start date';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setResult(null);
    if (Object.keys(next).length > 0) return;

    const res = await onCreate(values.roomId, { startDate: values.startDate, endDate: values.endDate || null, reason: values.reason.trim() || 'Maintenance' });
    if (res.ok) {
      setResult({ tone: 'success', title: `Room ${res.block.room?.roomNumber} blocked`, message: res.block.endDate ? `Until ${formatDisplayDate(res.block.endDate)}.` : 'Until lifted.' });
      setValues((v) => ({ ...v, roomId: '', endDate: '', reason: 'Maintenance' }));
    } else if (res.error?.isValidation) {
      setErrors(res.error.fieldErrors);
    } else {
      setResult({ tone: res.error?.status === 409 ? 'warning' : 'error', title: 'Could not block the room', message: res.error?.message, details: res.error?.details });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Block a room">
      <Select id="blockRoom" label="Room" value={values.roomId} onChange={update('roomId')} error={errors.roomId} required>
        <option value="">Choose a room…</option>
        {rooms
          .filter((r) => r.isActive)
          .map((r) => (
            <option key={r.id} value={r.id}>
              {r.roomNumber} · {r.category}
            </option>
          ))}
      </Select>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input id="blockStart" label="From" type="date" value={values.startDate} onChange={update('startDate')} error={errors.startDate} required />
        <Input
          id="blockEnd"
          label="Until"
          type="date"
          value={values.endDate}
          min={values.startDate}
          onChange={update('endDate')}
          error={errors.endDate}
          hint="Leave empty to block until lifted"
        />
      </div>
      <Input id="blockReason" label="Reason" type="text" value={values.reason} onChange={update('reason')} error={errors.reason} maxLength={200} placeholder="e.g. Plumbing repair" />

      {result && (
        <Alert tone={result.tone} title={result.title}>
          {result.message}
          {Array.isArray(result.details) && result.details.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-xs">
              {result.details.map((d) => (
                <li key={d.bookingId ?? `${d.field}-${d.message}`}>
                  {d.guestName ? `${d.guestName} · ${formatDisplayDate(d.checkIn)} → ${formatDisplayDate(d.checkOut)}` : d.message}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}

      <Button type="submit" variant="secondary" loading={creating} className="w-full sm:w-auto">
        {creating ? 'Blocking…' : 'Block room'}
      </Button>
    </form>
  );
}

/**
 * Maintenance blocks: rooms taken out of service for a period. A blocked
 * room never appears in availability for those dates (rule 3). Blocks are
 * refused for rooms with guests booked in the period.
 */
export default function RoomBlocksCard({ blocks, rooms, loading, error, busyId, creating, onCreate, onLift, onRefresh }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Block a room</h3>
        <BlockForm rooms={rooms} creating={creating} onCreate={onCreate} />
      </div>

      <div className="lg:col-span-3">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Current and upcoming blocks</h3>
        {error ? (
          <Alert tone="error" title="Could not load blocks" action={<Button variant="secondary" size="sm" onClick={onRefresh}>Try again</Button>}>
            {error.message}
          </Alert>
        ) : loading && blocks.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
            <Spinner className="h-4 w-4" /> Loading blocks…
          </div>
        ) : blocks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-sand-300 bg-sand-50 px-4 py-6 text-center text-sm text-slate-500">
            No rooms are blocked. Every in-service room is bookable.
          </p>
        ) : (
          <ul className="divide-y divide-sand-100 rounded-lg border border-sand-200" aria-label="Room blocks">
            {blocks.map((b) => (
              <li key={b.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    Room {b.room?.roomNumber} <span className="font-normal text-slate-500">· {b.room?.category}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDisplayDate(b.startDate)} → {b.endDate ? formatDisplayDate(b.endDate) : 'until lifted'} · {b.reason}
                  </p>
                </div>
                <LiftAction block={b} busy={busyId === b.id} onLift={onLift} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
