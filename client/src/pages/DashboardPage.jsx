import { useCallback, useState } from 'react';
import Header from '../components/layout/Header.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Icon from '../components/ui/Icon.jsx';
import StatsCards from '../components/dashboard/StatsCards.jsx';
import SearchForm from '../components/availability/SearchForm.jsx';
import RoomList from '../components/availability/RoomList.jsx';
import BookingPanel from '../components/booking/BookingPanel.jsx';
import RecentBookings from '../components/booking/RecentBookings.jsx';
import RoomBlocksCard from '../components/rooms/RoomBlocksCard.jsx';
import { useCategories } from '../hooks/useCategories.js';
import { useAvailability } from '../hooks/useAvailability.js';
import { useCreateBooking } from '../hooks/useCreateBooking.js';
import { useBookings } from '../hooks/useBookings.js';
import { useStats } from '../hooks/useStats.js';
import { useBlocks } from '../hooks/useBlocks.js';
import { todayIso, addDays } from '../utils/dates.js';

/**
 * The single front-desk screen. Owns the flow:
 *   search → Book now → side panel (details → review → confirmed)
 * The summary cards describe the searched dates (tonight before a search).
 * After any booking, cancellation, check-out or block change everything
 * that depends on room occupancy is re-fetched, so every number on screen
 * comes from the API.
 */
export default function DashboardPage() {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const availability = useAvailability();
  const createBooking = useCreateBooking();
  const recent = useBookings({ limit: 10 });
  const stats = useStats();
  const blocks = useBlocks();

  const [selectedRoom, setSelectedRoom] = useState(null);

  const initialSearch = { checkIn: todayIso(), checkOut: addDays(todayIso(), 1), category: '' };

  /** Everything that reflects room occupancy. */
  const syncOccupancy = useCallback(() => {
    stats.refresh();
    if (availability.status === 'success') availability.refresh();
  }, [stats.refresh, availability.refresh, availability.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    (params) => {
      setSelectedRoom(null);
      createBooking.reset();
      availability.search(params);
      stats.load(params); // the cards follow the searched dates
    },
    [availability.search, createBooking.reset, stats.load] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleSelectRoom = (room) => {
    createBooking.reset();
    setSelectedRoom(room);
  };

  const closePanel = () => {
    if (createBooking.submitting) return;
    setSelectedRoom(null);
    createBooking.reset();
  };

  /** Called by the panel's review step. Returns the result so the panel can react immediately. */
  const handleConfirmBooking = async (payload) => {
    const result = await createBooking.submit(payload);
    if (result.ok) {
      availability.refresh();
      recent.refresh();
      stats.refresh();
    } else if (result.error?.isConflict) {
      // Someone else got the room between search and confirm — drop it from the list now.
      availability.refresh();
      stats.refresh();
    }
    return result;
  };

  const handleCancelBooking = async (id) => {
    if (await recent.cancel(id)) syncOccupancy();
  };

  const handleCheckOutBooking = async (id) => {
    if (await recent.checkOut(id)) syncOccupancy();
  };

  const handleCreateBlock = async (roomId, body) => {
    const result = await blocks.create(roomId, body);
    if (result.ok) syncOccupancy();
    return result;
  };

  const handleLiftBlock = async (id) => {
    const result = await blocks.lift(id);
    if (result.ok) syncOccupancy();
    return result;
  };

  const { checkIn, checkOut } = availability.params ?? {};
  const searched = availability.status === 'success';

  return (
    <div id="top" className="min-h-screen">
      <a
        href="#availability"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-800 focus:shadow-lg"
      >
        Skip to availability
      </a>

      <Header />

      {/* Hero: title + the booking bar, which overlaps the band's bottom edge */}
      <section className="hero-band" aria-labelledby="page-title">
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-14 lg:px-8">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 rise-in">
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            Front desk
          </p>
          <h1 id="page-title" className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white rise-in rise-in-delay-1 sm:text-4xl lg:text-[2.75rem]">
            Room availability &amp; booking
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/75 rise-in rise-in-delay-2 sm:text-base">
            Pick the dates, see every room that is free for the whole stay, and book the guest in. A room can never be booked
            twice for the same night.
          </p>
        </div>
      </section>

      <main className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Booking bar — pulled up into the hero */}
        <div id="availability" className="-mt-16 scroll-mt-24 sm:-mt-20">
          <div className="surface p-4 shadow-[var(--shadow-lift)] sm:p-5 rise-in rise-in-delay-2">
            <SearchForm
              initialValues={initialSearch}
              categories={categories}
              categoriesLoading={categoriesLoading}
              loading={availability.status === 'loading'}
              onSearch={handleSearch}
            />
          </div>
        </div>

        {categoriesError && (
          <Alert tone="error" title="Could not load room categories" className="mt-6">
            {categoriesError.message} You can still search across all categories.
          </Alert>
        )}

        <div className="mt-8 sm:mt-10">
          <StatsCards stats={stats.data} loading={stats.loading} error={stats.error} range={stats.range} onRetry={stats.refresh} />
        </div>

        <div className="mt-8 sm:mt-10">
          <Card
            eyebrow="Results"
            title="Available rooms"
            subtitle={searched ? 'Only rooms free for every night of the stay, by category' : 'Search above to see which rooms are free'}
            actions={
              searched && (
                <Button variant="ghost" size="sm" onClick={availability.refresh} icon={<Icon name="refresh" className="h-4 w-4" />}>
                  Refresh
                </Button>
              )
            }
          >
            <RoomList
              status={availability.status}
              data={availability.data}
              error={availability.error}
              selectedRoomId={selectedRoom?.id}
              onSelect={handleSelectRoom}
              onRetry={availability.refresh}
            />
          </Card>
        </div>

        <div className="mt-8 sm:mt-10">
          <Card
            id="bookings"
            eyebrow="Records"
            title="Recent bookings"
            subtitle="Latest 10 · cancelling or checking out a guest frees the room's remaining nights immediately"
            className="scroll-mt-24"
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={recent.refresh}
                loading={recent.loading && recent.bookings.length > 0}
                icon={<Icon name="refresh" className="h-4 w-4" />}
              >
                Refresh
              </Button>
            }
          >
            <RecentBookings
              bookings={recent.bookings}
              loading={recent.loading}
              error={recent.error}
              busyId={recent.busyId}
              actionError={recent.actionError}
              onCancel={handleCancelBooking}
              onCheckOut={handleCheckOutBooking}
              onRefresh={recent.refresh}
            />
          </Card>
        </div>

        <div className="mt-8 sm:mt-10">
          <Card
            id="blocks"
            eyebrow="Housekeeping"
            title="Maintenance blocks"
            subtitle="Rooms out of service for a period are never offered for those dates"
            className="scroll-mt-24"
          >
            <RoomBlocksCard
              blocks={blocks.blocks}
              rooms={blocks.rooms}
              loading={blocks.loading}
              error={blocks.error}
              busyId={blocks.busyId}
              creating={blocks.creating}
              onCreate={handleCreateBlock}
              onLift={handleLiftBlock}
              onRefresh={blocks.refresh}
            />
          </Card>
        </div>
      </main>

      <footer className="border-t border-sand-200/80 bg-white/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-ink-400 sm:flex-row sm:px-6 lg:px-8">
          <span className="font-display text-sm text-ink-500">Nimba Stay</span>
          <span>Front-desk booking tool for Nimba Nature Cure &amp; Holistic Centre</span>
        </div>
      </footer>

      {selectedRoom && checkIn && checkOut && (
        <BookingPanel
          key={`${selectedRoom.id}:${checkIn}:${checkOut}`}
          room={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          submitting={createBooking.submitting}
          onConfirm={handleConfirmBooking}
          onClose={closePanel}
          onChooseAnotherRoom={closePanel}
        />
      )}
    </div>
  );
}
