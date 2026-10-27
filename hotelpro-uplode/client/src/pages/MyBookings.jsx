import { useEffect, useState } from 'react';
import api, { errMsg, fmtDate, money } from '../api';

const STATUS_CLASS = {
  confirmed: 'bg-primary',
  'checked-in': 'bg-success',
  'checked-out': 'bg-secondary',
  cancelled: 'bg-danger',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [method, setMethod] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/bookings/my');
      setBookings(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setError('');
    setNotice('');
    try {
      await api.put(`/bookings/${id}/cancel`);
      setNotice('Booking cancelled.');
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const pay = async (id) => {
    setError('');
    setNotice('');
    try {
      const { data } = await api.post('/payments', { bookingId: id, method: method[id] || 'upi' });
      setNotice(`Payment successful. Transaction ID: ${data.transactionId}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">My bookings</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      {loading && <p>Loading...</p>}
      {!loading && bookings.length === 0 && <div className="alert alert-secondary">You have no bookings yet. Search for a room to get started.</div>}

      <div className="row g-3">
        {bookings.map((b) => (
          <div className="col-md-6" key={b._id}>
            <div className="card room-card">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <h5 className="mb-1">{b.room ? `${b.room.type} · Room ${b.room.roomNumber}` : 'Room removed'}</h5>
                  <span className={`badge ${STATUS_CLASS[b.status]}`}>{b.status}</span>
                </div>
                <p className="mb-1 text-muted">{fmtDate(b.checkIn)} to {fmtDate(b.checkOut)} · {b.nights} night{b.nights > 1 ? 's' : ''} · {b.guests} guest{b.guests > 1 ? 's' : ''}</p>
                <p className="mb-3">
                  Total <strong>{money(b.totalAmount)}</strong>{' '}
                  <span className={`badge ${b.paymentStatus === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>{b.paymentStatus}</span>
                </p>
                {b.status !== 'cancelled' && b.paymentStatus === 'unpaid' && (
                  <div className="input-group mb-2">
                    <select className="form-select" value={method[b._id] || 'upi'} onChange={(e) => setMethod({ ...method, [b._id]: e.target.value })}>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="cash">Cash at hotel</option>
                    </select>
                    <button className="btn btn-brass" onClick={() => pay(b._id)}>Pay {money(b.totalAmount)}</button>
                  </div>
                )}
                {b.status === 'confirmed' && (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(b._id)}>Cancel booking</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
