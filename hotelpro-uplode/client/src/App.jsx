import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Rooms from './pages/Rooms';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Rooms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin', 'staff']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<div className="container py-5"><h3>Page not found</h3></div>} />
      </Routes>
      <footer className="text-center text-muted small py-4">HotelPro · Hotel Management System</footer>
    </>
  );
}
