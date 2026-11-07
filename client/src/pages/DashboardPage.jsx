import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../components/layout/Header.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import SearchForm from '../components/availability/SearchForm.jsx';
import RoomList from '../components/availability/RoomList.jsx';
import BookingForm from '../components/booking/BookingForm.jsx';
import BookingSuccess from '../components/booking/BookingSuccess.jsx';
import RecentBookings from '../components/booking/RecentBookings.jsx';
import { useCategories } from '../hooks/useCategories.js';
import { useAvailability } from '../hooks/useAvailability.js';
import { useCreateBooking } from '../hooks/useCreateBooking.js';
import { useBookings } from '../hooks/useBookings.js';
import { todayIso, addDays } from '../utils/dates.js';

/**
 * The single front-desk screen. Owns the flow:
 *   search → pick a room → enter guest → confirm → success (availability refreshed)
 * All business data (prices, nights, categories, conflicts) comes from the API.
 */
export default function DashboardPage() {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const availability = useAvailability();
  const createBooking = useCreateBooking();
  const recent = useBookings({ limit: 10 });

  const [selectedRoom, setSelectedRoom] = useState(null);
  const bookingPanelRef = useRef(null);

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

  useEffect(() => {
    if (selectedRoom && bookingPanelRef.current) {
      bookingPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedRoom]);

  const handleSubmitBooking = async (payload) => {
    const booking = await createBooking.submit(payload);
    if (booking) {
      setSelectedRoom(null);
      // The room is now taken for these dates: refresh so it disappears from the list.
      availability.refresh();
      recent.refresh();
    } else if (createBooking.error?.isConflict) {
      // Someone else got the room between search and confirm — re-sync the list.
      availability.refresh();
    }
  };

  const handleRefreshAfterConflict = () => {
    setSelectedRoom(null);
    createBooking.reset();
    availability.refresh();
  };

  const handleCancelBooking = async (id) => {
    const updated = await recent.cancel(id);
    // A cancelled booking frees its nights: refresh availability if a search is showing.
    if (updated && availability.status === 'success') availability.refresh();
  };

  const startNewBooking = () => {
    createBooking.reset();
    setSelectedRoom(null);
  };

  const { checkIn, checkOut } = availability.params ?? {};

  return (
    <div id="top" className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Room Availability &amp; Booking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Check which rooms are free for a stay and book a guest in. A room can never be booked twice for the same night.
          </p>
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

          {/* Results + booking */}
          <div className="space-y-6 lg:col-span-2">
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

            <div ref={bookingPanelRef}>
              {createBooking.booking ? (
                <Card eyebrow="Done" title="Booking confirmation">
                  <BookingSuccess booking={createBooking.booking} onNewBooking={startNewBooking} />
                </Card>
              ) : selectedRoom ? (
                <Card eyebrow="Step 3" title="Guest details" subtitle={`Booking room ${selectedRoom.roomNumber}`}>
                  <BookingForm
                    key={selectedRoom.id}
                    room={selectedRoom}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    submitting={createBooking.submitting}
                    error={createBooking.error}
                    onSubmit={handleSubmitBooking}
                    onCancel={startNewBooking}
                    onRefreshAvailability={handleRefreshAfterConflict}
                  />
                </Card>
              ) : null}
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="mt-8">
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
    </div>
  );
}
