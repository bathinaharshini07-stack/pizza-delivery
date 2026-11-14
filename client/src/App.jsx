import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Login, Register, Forgot, Reset, Verify } from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

function Guard({ role, children }) {
  const u = getUser();
  if (!u) return <Navigate to="/login" replace />;
  if (role && u.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const nav = useNavigate(), u = getUser();
  const logout = () => { localStorage.clear(); nav('/login'); };
  return (
    <>
      <header className="top">
        <Link to="/" className="brand">Crust &amp; Co</Link>
        {u && <nav>
          {u.role === 'admin' && <Link to="/admin">Admin</Link>}
          <Link to="/">Menu</Link>
          <button className="link" onClick={logout}>Log out ({u.name})</button>
        </nav>}
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Guard><Dashboard /></Guard>} />
          <Route path="/admin" element={<Guard role="admin"><Admin /></Guard>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/reset/:token" element={<Reset />} />
          <Route path="/verify/:token" element={<Verify />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
