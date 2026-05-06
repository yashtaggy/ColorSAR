import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, User, LayoutDashboard, Info } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <nav className="glass-morphism" style={{ margin: '1rem', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, position: 'sticky', top: '1rem' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Color<span className="accent-text">SAR</span></h2>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
                    <Info size={18} /> How it Works
                </Link>

                {user ? (
                    <>
                        <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>
                        <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                            <User size={18} /> Profile
                        </Link>
                        <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                            Settings
                        </Link>
                        <button onClick={toggleTheme} className="btn-secondary" style={{ padding: '0.5rem' }}>
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem', color: '#ef4444' }}>
                            <LogOut size={18} />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={toggleTheme} className="btn-secondary" style={{ padding: '0.5rem' }}>
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <Link to="/login" className="btn-secondary">Login</Link>
                        <Link to="/signup" className="btn-primary">Get Started</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
