// src/components/Dashboard.jsx
import React from 'react';
import ShortenerForm from './ShortenerForm'; // Import the ShortenerForm component

function Dashboard({ user }) {
    return (
        <div className="flex flex-col gap-8 w-full max-w-lg"> {/* Adjusted max-w for just the form */}
            {/* Shortener Form Section - This is all the dashboard now */}
            <div className="bg-white p-8 rounded-lg shadow-xl w-full">
                {/* No onShortenSuccess prop needed here, as it doesn't display URLs */}
                <ShortenerForm user={user} />
            </div>
            {/* Removed the URLs table section */}
        </div>
    );
}

export default Dashboard;