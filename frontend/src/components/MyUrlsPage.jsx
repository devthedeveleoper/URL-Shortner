// src/components/MyUrlsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdDelete } from 'react-icons/md'; // Import delete icon
import { FaClipboard } from 'react-icons/fa'; // Import clipboard icon for URL rows

function MyUrlsPage({ user }) {
    const [userUrls, setUserUrls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchUserUrls();
        }
    }, [user]);

    const fetchUserUrls = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:5000/api/my-urls');
            setUserUrls(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch your URLs.');
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this URL?')) {
            try {
                await axios.delete(`http://localhost:5000/api/urls/${id}`);
                fetchUserUrls(); // Refresh the list after deletion
                alert('URL deleted successfully! ✅');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete URL.');
            }
        }
    };

    const handleCopyShortUrl = (shortUrl) => {
        navigator.clipboard.writeText(shortUrl);
        alert('Short URL copied to clipboard! 📋');
    };

    if (loading) {
        return <div className="text-center text-gray-600">Loading your URLs...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl"> {/* Adjusted max-w for the table */}
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Your Shortened URLs</h2>
            {userUrls.length === 0 ? (
                <p className="text-center text-gray-600">You haven't shortened any URLs yet. Go to your <Link to="/dashboard" className="text-indigo-600 hover:underline">dashboard</Link> to get started!</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original URL</th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short URL</th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {userUrls.map((url) => (
                                <tr key={url.id}>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs" title={url.originalUrl}>
                                        <a href={url.originalUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                            {url.originalUrl}
                                        </a>
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mr-2">
                                                {url.customAlias}
                                            </a>
                                            <button
                                                onClick={() => handleCopyShortUrl(url.shortUrl)}
                                                className="p-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-full flex items-center justify-center"
                                                title="Copy short URL"
                                            >
                                                <FaClipboard size={12} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{url.clicks}</td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">{new Date(url.createdAt).toLocaleDateString()}</td>
                                    <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(url.id)}
                                            className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out flex items-center justify-center"
                                        >
                                            <MdDelete className="mr-1" /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default MyUrlsPage;