import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link if not already

function AuthForm({ type, onAuthSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const url = `http://localhost:5000/auth/${type}`;
            const response = await axios.post(url, { email, password });
            setMessage(response.data.message);
            onAuthSuccess(response.data.user);
        } catch (err) {
            setError(err.response?.data?.message || `Error during ${type}.`);
        }
    };

    // GitHub auth is now primarily handled by the button in App.js navigation
    // You could still keep a small "Login with GitHub" link here for consistency
    // but the main button is higher up.

    return (
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
                {type === 'login' ? 'Login' : 'Register'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                        Email:
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@example.com"
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                        Password:
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                >
                    {type === 'login' ? 'Login' : 'Register'}
                </button>
            </form>

            {/* Optional: Add a link for GitHub login here if you want it duplicated or as an alternative */}
            <div className="text-center mt-4">
                {type === 'login' ? (
                    <p className="text-gray-600">
                        Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline">Register here.</Link>
                    </p>
                ) : (
                    <p className="text-gray-600">
                        Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login here.</Link>
                    </p>
                )}
            </div>


            {message && (
                <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    <p>{message}</p>
                </div>
            )}
            {error && (
                <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
}

export default AuthForm;