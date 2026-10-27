import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user && (user.role === 'admin' || user.role === 'staff');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-md navbar-hp">
      <div className="container">
        <Link className="navbar-brand fs-4" to="/">HotelPro</Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#hpNav" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>
        <div className="collapse navbar-collapse" id="hpNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><NavLink className="nav-link" to="/" end>Rooms</NavLink></li>
            {user && <li className="nav-item"><NavLink className="nav-link" to="/my-bookings">My bookings</NavLink></li>}
            {isStaff && <li className="nav-item"><NavLink className="nav-link" to="/admin">Dashboard</NavLink></li>}
          </ul>
          <ul className="navbar-nav align-items-md-center gap-md-2">
            {user ? (
              <>
                <li className="nav-item text-white small me-md-2">{user.name} ({user.role})</li>
                <li className="nav-item"><button className="btn btn-sm btn-outline-light" onClick={handleLogout}>Log out</button></li>
              </>
            ) : (
              <>
                <li className="nav-item"><NavLink className="nav-link" to="/login">Log in</NavLink></li>
                <li className="nav-item"><Link className="btn btn-sm btn-brass" to="/register">Create account</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
