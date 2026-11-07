import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Alert from '../ui/Alert.jsx';
import Badge, { categoryTone } from '../ui/Badge.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Icon from '../ui/Icon.jsx';
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
    <div
      className="flex flex-wrap items-center justify-end gap-2 rounded-lg bg-sand-50 px-2 py-1.5 ring-1 ring-inset ring-sand-200"
      role="group"
      aria-label={`Confirm lifting the block on room ${block.room?.roomNumber}`}
    >
      <span className="text-xs text-ink-500">Back in service?</span>
      <Button variant="primary" size="sm" loading={busy} onClick={() => onLift(block.id)}>
        Yes, lift
      </Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </div>
  );
}

function DateRangeChip({ startDate, endDate }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-2.5 py-0.5 text-xs text-ink-700 ring-1 ring-inset ring-sand-200">
      <Icon name="calendar" className="h-3.5 w-3.5 text-ink-400" />
      <span>
        {formatDisplayDate(startDate)} → {endDate ? formatDisplayDate(endDate) : 'until lifted'}
      </span>
    </span>
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

    const res = await onCreate(values.roomId, {
      startDate: values.startDate,
      endDate: values.endDate || null,
      reason: values.reason.trim() || 'Maintenance',
    });
    if (res.ok) {
      setResult({
        tone: 'success',
        title: `Room ${res.block.room?.roomNumber} blocked`,
        message: res.block.endDate ? `Out of service until ${formatDisplayDate(res.block.endDate)}.` : 'Out of service until lifted.',
      });
      setValues((v) => ({ ...v, roomId: '', endDate: '', reason: 'Maintenance' }));
    } else if (res.error?.isValidation) {
      setErrors(res.error.fieldErrors);
    } else {
      setResult({
        tone: res.error?.status === 409 ? 'warning' : 'error',
        title: 'Could not block the room',
        message: res.error?.message,
        details: res.error?.details,
      });
    }
  };

  const calendar = <Icon name="calendar" className="h-4 w-4" />;

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
        <Input id="blockStart" label="From" type="date" leading={calendar} value={values.startDate} onChange={update('startDate')} error={errors.startDate} required />
        <Input
          id="blockEnd"
          label="Until"
          type="date"
          leading={calendar}
          value={values.endDate}
          min={values.startDate}
          onChange={update('endDate')}
          error={errors.endDate}
          hint="Leave empty to block until lifted"
        />
      </div>
      <Input
        id="blockReason"
        label="Reason"
        type="text"
        leading={<Icon name="wrench" className="h-4 w-4" />}
        value={values.reason}
        onChange={update('reason')}
        error={errors.reason}
        maxLength={200}
        placeholder="e.g. Plumbing repair"
      />

      {result && (
        <Alert tone={result.tone} title={result.title}>
          {result.message}
          {Array.isArray(result.details) && result.details.length > 0 && (
            <ul className="mt-1.5 list-inside list-disc text-xs">
              {result.details.map((d) => (
                <li key={d.bookingId ?? `${d.field}-${d.message}`}>
                  {d.guestName ? `${d.guestName} · ${formatDisplayDate(d.checkIn)} → ${formatDisplayDate(d.checkOut)}` : d.message}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}

      <Button type="submit" variant="secondary" loading={creating} icon={<Icon name="wrench" className="h-4 w-4" />} className="w-full sm:w-auto">
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
        <div className="rounded-xl border border-sand-200 bg-sand-50/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" aria-hidden="true">
              <Icon name="wrench" className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold text-ink-900">Block a room</h3>
              <p className="text-xs text-ink-500">Take it out of service for a period, or until you lift it.</p>
            </div>
          </div>
          <BlockForm rooms={rooms} creating={creating} onCreate={onCreate} />
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink-900">Current and upcoming blocks</h3>
          {blocks.length > 0 && <span className="text-xs text-ink-500">{blocks.length} active</span>}
        </div>
        {error ? (
          <Alert
            tone="error"
            title="Could not load blocks"
            action={
              <Button variant="secondary" size="sm" icon={<Icon name="refresh" className="h-4 w-4" />} onClick={onRefresh}>
                Try again
              </Button>
            }
          >
            {error.message}
          </Alert>
        ) : loading && blocks.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
            <Spinner className="h-4 w-4" /> Loading blocks…
          </div>
        ) : blocks.length === 0 ? (
          <EmptyState compact title="No rooms are blocked" description="Every in-service room is bookable right now." />
        ) : (
          <ul className="divide-y divide-sand-100 overflow-hidden rounded-xl border border-sand-200 bg-white" aria-label="Room blocks">
            {blocks.map((b, i) => (
              <li key={b.id} className="rise-in flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-semibold text-ink-900">Room {b.room?.roomNumber}</span>
                    {b.room?.category && <Badge tone={categoryTone(b.room.category)}>{b.room.category}</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DateRangeChip startDate={b.startDate} endDate={b.endDate} />
                    <span className="text-sm text-ink-500">{b.reason}</span>
                  </div>
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
