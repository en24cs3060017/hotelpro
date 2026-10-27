import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg, money } from '../api';
import { useAuth } from '../context/AuthContext';

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

export default function Rooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const [search, setSearch] = useState({ checkIn: iso(today), checkOut: iso(addDays(today, 1)), guests: 1 });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState(null);

  const nights = Math.max(0, Math.round((new Date(search.checkOut) - new Date(search.checkIn)) / 86400000));

  const loadRooms = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/rooms/available', { params: search });
      setRooms(data);
    } catch (err) {
      setRooms([]);
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line
  }, []);

  const onChange = (e) => setSearch({ ...search, [e.target.name]: e.target.value });

  const onSearch = (e) => {
    e.preventDefault();
    loadRooms();
  };

  const book = async (room) => {
    if (!user) return navigate('/login');
    if (user.role !== 'guest') return setError('Please book from a guest account.');
    setBookingId(room._id);
    setError('');
    try {
      await api.post('/bookings', {
        roomId: room._id,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        guests: Number(search.guests),
      });
      navigate('/my-bookings');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBookingId(null);
    }
  };

  return (
    <>
      <div className="hero">
        <div className="container">
          <h1 className="display-5">Find a room for your stay</h1>
          <p className="mb-0 opacity-75">Pick your dates and see what is free.</p>
        </div>
      </div>

      <div className="container search-panel">
        <form className="card shadow-sm p-3" onSubmit={onSearch}>
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Check-in</label>
              <input type="date" className="form-control" name="checkIn" min={iso(today)} value={search.checkIn} onChange={onChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Check-out</label>
              <input type="date" className="form-control" name="checkOut" min={search.checkIn} value={search.checkOut} onChange={onChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Guests</label>
              <input type="number" className="form-control" name="guests" min="1" max="10" value={search.guests} onChange={onChange} required />
            </div>
            <div className="col-md-3">
              <button className="btn btn-brass w-100" disabled={loading}>{loading ? 'Searching...' : 'Search rooms'}</button>
            </div>
          </div>
        </form>
      </div>

      <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}
        {!loading && !error && rooms.length === 0 && (
          <div className="alert alert-secondary">No rooms are free for these dates. Try different dates or fewer guests.</div>
        )}
        <div className="row g-4">
          {rooms.map((room) => (
            <div className="col-md-6 col-lg-4" key={room._id}>
              <div className="card room-card h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h4 className="mb-0">{room.type} · {room.roomNumber}</h4>
                      <small className="text-muted">Up to {room.capacity} guest{room.capacity > 1 ? 's' : ''}</small>
                    </div>
                    <div className="text-end">
                      <div className="room-price">{money(room.price)}</div>
                      <small className="text-muted">per night</small>
                    </div>
                  </div>
                  <p className="mt-3 mb-2">{room.description}</p>
                  <div className="mb-3">
                    {room.amenities.map((a) => (
                      <span key={a} className="badge badge-soft me-1 mb-1">{a}</span>
                    ))}
                  </div>
                  <div className="mt-auto">
                    {nights > 0 && <p className="small text-muted mb-2">{nights} night{nights > 1 ? 's' : ''} total: <strong>{money(nights * room.price)}</strong></p>}
                    <button className="btn btn-teal w-100" disabled={bookingId === room._id} onClick={() => book(room)}>
                      {bookingId === room._id ? 'Booking...' : user ? 'Book this room' : 'Log in to book'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
