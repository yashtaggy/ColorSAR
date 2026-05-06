import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import About from './pages/About';
import Settings from './pages/Settings';
import Footer from './components/Footer';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                        <Navbar />
                        <main className="container" style={{ flex: 1, padding: '2rem 0' }}>
                            <Routes>
                                <Route path="/" element={<Landing />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/login" element={<AuthPage isSignup={false} />} />
                                <Route path="/signup" element={<AuthPage isSignup={true} />} />
                                <Route
                                    path="/dashboard"
                                    element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                                />
                                <Route
                                    path="/profile"
                                    element={<ProtectedRoute><Profile /></ProtectedRoute>}
                                />
                                <Route
                                    path="/settings"
                                    element={<ProtectedRoute><Settings /></ProtectedRoute>}
                                />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
