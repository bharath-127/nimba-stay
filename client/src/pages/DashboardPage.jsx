import { useCallback, useState } from 'react';
import Sidebar from '../components/layout/Sidebar.jsx';
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
import RecentBookingsCompact from '../components/booking/RecentBookingsCompact.jsx';
import RoomBlocksCard from '../components/rooms/RoomBlocksCard.jsx';
import MaintenanceBlocksCompact from '../components/rooms/MaintenanceBlocksCompact.jsx';
import { useCategories } from '../hooks/useCategories.js';
import { useAvailability } from '../hooks/useAvailability.js';
import { useCreateBooking } from '../hooks/useCreateBooking.js';
import { useBookings } from '../hooks/useBookings.js';
import { useStats } from '../hooks/useStats.js';
import { useBlocks } from '../hooks/useBlocks.js';
import { todayIso, addDays } from '../utils/dates.js';

/** Smooth-scroll to a section and move focus to it (sections are focusable, tabIndex -1). */
function jumpTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
}

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

  return (
    <div id="top" className="min-h-screen lg:pl-[230px]">
      <a
        href="#availability"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-800 focus:shadow-lg"
      >
        Skip to availability
      </a>

      <Sidebar active="dashboard" />

      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <StatsCards stats={stats.data} loading={stats.loading} error={stats.error} range={stats.range} onRetry={stats.refresh} />

          {categoriesError && (
            <Alert tone="error" title="Could not load room categories" className="mt-6">
              {categoriesError.message} You can still search across all categories.
            </Alert>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
            {/* Left: search + results */}
            <div className="min-w-0 space-y-6">
              <section id="availability" tabIndex={-1} className="surface scroll-mt-24 p-5 focus:outline-none sm:p-6 rise-in" aria-labelledby="search-title">
                <div className="mb-5 flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700" aria-hidden="true">
                    <Icon name="search" className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <h2 id="search-title" className="font-display text-xl font-semibold leading-tight text-ink-900">
                      Search Room Availability
                    </h2>
                    <p className="mt-1 text-sm text-ink-500">Select stay dates and room category to find available rooms.</p>
                  </div>
                </div>
                <SearchForm
                  initialValues={initialSearch}
                  categories={categories}
                  categoriesLoading={categoriesLoading}
                  loading={availability.status === 'loading'}
                  onSearch={handleSearch}
                />
              </section>

              <div className="rise-in rise-in-delay-1">
                <RoomList
                  status={availability.status}
                  data={availability.data}
                  error={availability.error}
                  selectedRoomId={selectedRoom?.id}
                  onSelect={handleSelectRoom}
                  onRetry={availability.refresh}
                />
              </div>
            </div>

            {/* Right: compact records */}
            <aside className="min-w-0 space-y-6" aria-label="Recent activity">
              <div className="rise-in rise-in-delay-1">
                <RecentBookingsCompact bookings={recent.bookings} loading={recent.loading} error={recent.error} onViewAll={() => jumpTo('bookings')} />
              </div>
              <div className="rise-in rise-in-delay-2">
                <MaintenanceBlocksCompact blocks={blocks.blocks} loading={blocks.loading} error={blocks.error} onViewAll={() => jumpTo('maintenance')} />
              </div>
            </aside>
          </div>

          {/* Full sections the compact cards link to */}
          <section id="bookings" tabIndex={-1} className="mt-8 scroll-mt-24 focus:outline-none sm:mt-10">
            <Card
              eyebrow="Records"
              title="Recent bookings"
              subtitle="Latest 10 · cancelling or checking out a guest frees the room's remaining nights immediately"
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
          </section>

          <section id="maintenance" tabIndex={-1} className="mt-8 scroll-mt-24 focus:outline-none sm:mt-10">
            <Card eyebrow="Housekeeping" title="Maintenance blocks" subtitle="Rooms out of service for a period are never offered for those dates">
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
          </section>
        </main>

        <footer className="border-t border-sand-200/80 bg-white/40">
          <div className="flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-400 sm:flex-row sm:px-6 lg:px-8">
            <span className="font-display text-sm text-ink-500">Nimba Stay</span>
            <span>Front-desk booking tool for Nimba Nature Cure &amp; Holistic Centre</span>
          </div>
        </footer>
      </div>

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
