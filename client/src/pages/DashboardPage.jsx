import { useCallback, useState } from 'react';
import Header from '../components/layout/Header.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import StatsCards from '../components/dashboard/StatsCards.jsx';
import SearchForm from '../components/availability/SearchForm.jsx';
import RoomList from '../components/availability/RoomList.jsx';
import BookingPanel from '../components/booking/BookingPanel.jsx';
import RecentBookings from '../components/booking/RecentBookings.jsx';
import { useCategories } from '../hooks/useCategories.js';
import { useAvailability } from '../hooks/useAvailability.js';
import { useCreateBooking } from '../hooks/useCreateBooking.js';
import { useBookings } from '../hooks/useBookings.js';
import { useStats } from '../hooks/useStats.js';
import { todayIso, addDays } from '../utils/dates.js';

/**
 * The single front-desk screen. Owns the flow:
 *   search → Book now → side panel (details → review → confirmed)
 * After any booking or cancellation the availability list, the recent
 * bookings and the summary cards are re-fetched, so every number on screen
 * comes from the API.
 */
export default function DashboardPage() {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const availability = useAvailability();
  const createBooking = useCreateBooking();
  const recent = useBookings({ limit: 10 });
  const stats = useStats();

  const [selectedRoom, setSelectedRoom] = useState(null);

  const initialSearch = { checkIn: todayIso(), checkOut: addDays(todayIso(), 1), category: '' };

  const handleSearch = useCallback(
    (params) => {
      setSelectedRoom(null);
      createBooking.reset();
      availability.search(params);
    },
    [availability.search, createBooking.reset] // eslint-disable-line react-hooks/exhaustive-deps
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
      // The room is now taken for these nights: re-sync everything that shows it.
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
    const updated = await recent.cancel(id);
    if (updated) {
      // The server released the booking's nights: refresh what depends on them.
      stats.refresh();
      if (availability.status === 'success') availability.refresh();
    }
  };

  const { checkIn, checkOut } = availability.params ?? {};

  return (
    <div id="top" className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Room Availability &amp; Booking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Check which rooms are free for a stay and book a guest in. A room can never be booked twice for the same night.
          </p>
        </div>

        <div className="mb-6">
          <StatsCards stats={stats.data} loading={stats.loading} error={stats.error} onRetry={stats.refresh} />
        </div>

        {categoriesError && (
          <Alert tone="error" title="Could not load room categories" className="mb-6">
            {categoriesError.message} You can still search across all categories.
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Search */}
          <div className="lg:col-span-1">
            <Card id="availability" eyebrow="Step 1" title="Search availability" subtitle="Dates and category" className="lg:sticky lg:top-6">
              <SearchForm
                initialValues={initialSearch}
                categories={categories}
                categoriesLoading={categoriesLoading}
                loading={availability.status === 'loading'}
                onSearch={handleSearch}
              />
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <Card
              eyebrow="Step 2"
              title="Available rooms"
              subtitle="Only rooms free for every night of the stay"
              actions={
                availability.status === 'success' && (
                  <Button variant="ghost" size="sm" onClick={availability.refresh}>
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
        </div>

        {/* Recent bookings */}
        <div className="mt-6 sm:mt-8">
          <Card
            id="bookings"
            title="Recent bookings"
            subtitle="Latest 10 · cancelling a booking frees its nights immediately"
            actions={
              <Button variant="ghost" size="sm" onClick={recent.refresh} loading={recent.loading && recent.bookings.length > 0}>
                Refresh
              </Button>
            }
          >
            <RecentBookings
              bookings={recent.bookings}
              loading={recent.loading}
              error={recent.error}
              cancellingId={recent.cancellingId}
              cancelError={recent.cancelError}
              onCancel={handleCancelBooking}
              onRefresh={recent.refresh}
            />
          </Card>
        </div>
      </main>

      <footer className="border-t border-sand-200 py-6 text-center text-xs text-slate-400">
        Nimba Stay · Front-desk booking tool for Nimba Nature Cure &amp; Holistic Centre
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
