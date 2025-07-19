import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ShortenerForm from './components/ShortenerForm';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard'; // This will become the ShortenerForm wrapper
import MyUrlsPage from './components/MyUrlsPage'; // New component for My URLs

// Import React Icons
import { FaGithub } from 'react-icons/fa'; // For the GitHub icon
import { HiOutlineLink } from 'react-icons/hi'; // Example for a link icon next to Shorty
import { FiLogOut, FiUser, FiList } from 'react-icons/fi'; // For logout, user, and list icon

axios.defaults.withCredentials = true;

function App() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('http://localhost:5000/auth/current_user');
                setUser(res.data.user);
            } catch (err) {
                console.error('Error checking auth:', err);
                setUser(null);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        navigate('/dashboard'); // Redirect to the dashboard (now just the shortener form)
    };

    const handleLogout = async () => {
        try {
            await axios.get('http://localhost:5000/auth/logout');
            setUser(null);
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <nav className="bg-white shadow-md p-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center">
                    <HiOutlineLink className="mr-2" /> Shorty
                </Link>
                <div className="space-x-4 flex items-center">
                    {!user ? (
                        <>
                            <Link to="/login" className="text-gray-700 hover:text-indigo-600">Login</Link>
                            <Link to="/register" className="text-gray-700 hover:text-indigo-600">Register</Link>
                            <a href="http://localhost:5000/auth/github" className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded flex items-center justify-center">
                                <FaGithub className="w-5 h-5 mr-2" /> GitHub Login
                            </a>
                        </>
                    ) : (
                        <div className="flex items-center space-x-4">
                            {user.profilePicture && (
                                <img src={user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full border-2 border-indigo-500 object-cover" />
                            )}
                            <span className="text-gray-800 font-medium flex items-center">
                                <FiUser className="mr-1" /> Welcome, {user.displayName || user.email || 'User'}!
                            </span>
                            {/* Link to the new My URLs page */}
                            <Link to="/my-urls" className="text-gray-700 hover:text-indigo-600 flex items-center">
                                <FiList className="mr-1" /> My URLs
                            </Link>
                            <button onClick={handleLogout} className="text-gray-700 hover:text-indigo-600 flex items-center">
                                <FiLogOut className="mr-1" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
                <Routes>
                    {/* The root path can now be dedicated to ShortenerForm for anonymous users too, or redirect */}
                    <Route path="/" element={<ShortenerForm user={user} />} />
                    <Route path="/register" element={<AuthForm type="register" onAuthSuccess={handleLogin} />} />
                    <Route path="/login" element={<AuthForm type="login" onAuthSuccess={handleLogin} />} />
                    {/* Dashboard now only contains the ShortenerForm */}
                    <Route
                        path="/dashboard"
                        element={user ? <Dashboard user={user} /> : <p className="text-lg text-red-500">Please log in to view your dashboard.</p>}
                    />
                    {/* New route for MyUrlsPage */}
                    <Route
                        path="/my-urls"
                        element={user ? <MyUrlsPage user={user} /> : <p className="text-lg text-red-500">Please log in to view your URLs.</p>}
                    />
                    <Route path="*" element={<h2 className="text-3xl font-bold text-red-600">404 - Page Not Found</h2>} />
                </Routes>
            </main>

            <footer className="bg-gray-800 text-white p-4 text-center">
                © {new Date().getFullYear()} Shorty URL Shortener. All rights reserved.
            </footer>
        </div>
    );
}

export default App;