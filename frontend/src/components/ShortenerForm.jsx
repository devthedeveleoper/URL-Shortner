import React, { useState } from 'react';
import axios from 'axios';
import { FaClipboard } from 'react-icons/fa';

// Removed onShortenSuccess prop, as it's no longer needed for dashboard integration
function ShortenerForm({ user }) {
    const [originalUrl, setOriginalUrl] = useState('');
    const [customAlias, setCustomAlias] = useState('');
    const [shortenedUrl, setShortenedUrl] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setShortenedUrl('');

        try {
            const response = await axios.post('http://localhost:5000/api/shorten', {
                originalUrl,
                customAlias,
            });
            setShortenedUrl(response.data.shortUrl);
            setMessage(response.data.message);
            // Clear form fields
            setOriginalUrl('');
            setCustomAlias('');

            // No need to call onShortenSuccess here anymore
            // The user will navigate to MyUrlsPage to see their list

        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong while shortening URL.');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shortenedUrl);
        alert('Shortened URL copied to clipboard! 📋');
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-xl w-full">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Shorten Your URL</h2>
            {user && <p className="text-center text-gray-600 mb-4">You're logged in as: {user.displayName || user.email || 'User'}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="originalUrl" className="block text-gray-700 text-sm font-bold mb-2">
                        Long URL:
                    </label>
                    <input
                        type="url"
                        id="originalUrl"
                        value={originalUrl}
                        onChange={(e) => setOriginalUrl(e.target.value)}
                        placeholder="https://example.com/very/long/url"
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="customAlias" className="block text-gray-700 text-sm font-bold mb-2">
                        Custom Alias (optional):
                    </label>
                    <input
                        type="text"
                        id="customAlias"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        placeholder="my-short-link"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank for a random alias.</p>
                </div>
                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                >
                    Shorten URL
                </button>
            </form>

            {shortenedUrl && (
                <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    <p className="font-semibold mb-2">{message}</p>
                    <p>Your Shortened URL:</p>
                    <div className="flex items-center break-all">
                        <a
                            href={shortenedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline mr-2"
                        >
                            {shortenedUrl}
                        </a>
                        <button
                            onClick={handleCopy}
                            className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center"
                            title="Copy to clipboard"
                        >
                            <FaClipboard size={14} />
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
}

export default ShortenerForm;