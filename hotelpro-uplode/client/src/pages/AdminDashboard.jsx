import { useEffect, useState } from 'react';
import api, { errMsg, fmtDate, money } from '../api';
import { useAuth } from '../context/AuthContext';

const EMPTY_ROOM = { roomNumber: '', type: 'Single', price: '', capacity: 1, amenities: '', description: '' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAll = async () => {
    try {
      const [s, b, r] = await Promise.all([api.get('/admin/stats'), api.get('/bookings'), api.get('/rooms')]);
      setStats(s.data);
      setBookings(b.data);
      setRooms(r.data);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const run = async (fn, okMsg) => {
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(okMsg);
      loadAll();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const bookingAction = (id, action, msg) => run(() => api.put(`/bookings/${id}/${action}`), msg);

  const addRoom = (e) => {
    e.preventDefault();
    const payload = {
      ...roomForm,
      price: Number(roomForm.price),
      capacity: Number(roomForm.capacity),
      amenities: roomForm.amenities.split(',').map((a) => a.trim()).filter(Boolean),
    };
    run(async () => {
      await api.post('/rooms', payload);
      setRoomForm(EMPTY_ROOM);
    }, 'Room added.');
  };

  const toggleMaintenance = (room) =>
    run(() => api.put(`/rooms/${room._id}`, { status: room.status === 'available' ? 'maintenance' : 'available' }), 'Room status updated.');

  const deleteRoom = (room) => {
    if (!window.confirm(`Delete room ${room.roomNumber}?`)) return;
    run(() => api.delete(`/rooms/${room._id}`), 'Room deleted.');
  };

  const onRoomChange = (e) => setRoomForm({ ...roomForm, [e.target.name]: e.target.value });

  const tabs = [['overview', 'Overview'], ['bookings', 'Bookings'], ...(isAdmin ? [['rooms', 'Rooms']] : [])];

  return (
    <div className="container py-4">
      <h2 className="mb-3">{isAdmin ? 'Admin dashboard' : 'Front desk'}</h2>
      <ul className="nav nav-tabs mb-3">
        {tabs.map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button className={`nav-link ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
          </li>
        ))}
      </ul>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {tab === 'overview' && stats && (
        <div className="row g-3">
          {[
            ['Total rooms', stats.totalRooms],
            ['Occupied now', `${stats.occupiedRooms} (${stats.occupancyRate}%)`],
            ['Upcoming bookings', stats.upcomingBookings],
            ['All bookings', stats.totalBookings],
            ['Registered guests', stats.totalGuests],
            ['Revenue collected', money(stats.revenue)],
          ].map(([label, value]) => (
            <div className="col-6 col-lg-4" key={label}>
              <div className="card room-card p-3">
                <div className="text-muted small">{label}</div>
                <div className="room-price">{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="table-responsive">
          <table className="table table-hover bg-white">
            <thead>
              <tr><th>Guest</th><th>Room</th><th>Stay</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {bookings.length === 0 && <tr><td colSpan="7" className="text-center text-muted">No bookings yet.</td></tr>}
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.user ? b.user.name : '-'}<div className="small text-muted">{b.user && b.user.email}</div></td>
                  <td>{b.room ? b.room.roomNumber : '-'}</td>
                  <td>{fmtDate(b.checkIn)} to {fmtDate(b.checkOut)}</td>
                  <td>{money(b.totalAmount)}</td>
                  <td>{b.paymentStatus}</td>
                  <td>{b.status}</td>
                  <td className="text-nowrap">
                    {b.status === 'confirmed' && (
                      <>
                        <button className="btn btn-sm btn-teal me-1" onClick={() => bookingAction(b._id, 'checkin', 'Guest checked in.')}>Check in</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => bookingAction(b._id, 'cancel', 'Booking cancelled.')}>Cancel</button>
                      </>
                    )}
                    {b.status === 'checked-in' && (
                      <button className="btn btn-sm btn-brass" onClick={() => bookingAction(b._id, 'checkout', 'Guest checked out.')}>Check out</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'rooms' && isAdmin && (
        <>
          <form className="card p-3 mb-4" onSubmit={addRoom}>
            <h5 className="mb-3">Add a room</h5>
            <div className="row g-3">
              <div className="col-md-2"><input className="form-control" name="roomNumber" placeholder="Room no." value={roomForm.roomNumber} onChange={onRoomChange} required /></div>
              <div className="col-md-2">
                <select className="form-select" name="type" value={roomForm.type} onChange={onRoomChange}>
                  {['Single', 'Double', 'Deluxe', 'Suite'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-md-2"><input className="form-control" type="number" min="0" name="price" placeholder="Price / night" value={roomForm.price} onChange={onRoomChange} required /></div>
              <div className="col-md-2"><input className="form-control" type="number" min="1" name="capacity" placeholder="Guests" value={roomForm.capacity} onChange={onRoomChange} required /></div>
              <div className="col-md-4"><input className="form-control" name="amenities" placeholder="Amenities, comma separated" value={roomForm.amenities} onChange={onRoomChange} /></div>
              <div className="col-md-9"><input className="form-control" name="description" placeholder="Short description" value={roomForm.description} onChange={onRoomChange} /></div>
              <div className="col-md-3"><button className="btn btn-teal w-100">Add room</button></div>
            </div>
          </form>

          <div className="table-responsive">
            <table className="table table-hover bg-white">
              <thead><tr><th>Room</th><th>Type</th><th>Price</th><th>Guests</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r._id}>
                    <td>{r.roomNumber}</td>
                    <td>{r.type}</td>
                    <td>{money(r.price)}</td>
                    <td>{r.capacity}</td>
                    <td>{r.status}</td>
                    <td className="text-nowrap">
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => toggleMaintenance(r)}>
                        {r.status === 'available' ? 'Set maintenance' : 'Set available'}
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRoom(r)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
