require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const { v4: uuidv4 } = require('uuid'); // Import uuid

const User = require('./models/User'); // Ensure this path is correct
const Url = require('./models/Url');   // Ensure this path is correct
const configurePassport = require('./config/passport'); // Ensure this path is correct

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully! ✨'))
.catch(err => console.error('MongoDB connection error: ❌', err));

// Configure Passport.js
configurePassport(passport);

// --- Middleware ---
// CORS configuration: Essential for frontend-backend communication during development
app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from your React frontend
    credentials: true, // Allow cookies to be sent with requests
}));

// Body parsers: To parse incoming JSON and URL-encoded form data
app.use(express.json()); // For JSON request bodies
app.use(express.urlencoded({ extended: false })); // For URL-encoded form data

// Session Middleware: Manages user sessions
app.use(session({
    secret: process.env.SESSION_SECRET, // Secret key for signing the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }), // Store sessions in MongoDB
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // Session cookie expiration: 1 day (in milliseconds)
        httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === 'production' // Use secure cookies in production (HTTPS)
    }
}));

// Passport Middleware: Initializes Passport and session support
app.use(passport.initialize());
app.use(passport.session());

// --- Authentication Routes ---

// Register a new user with email and password
app.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }
        user = new User({ email, password });
        await user.save();
        // Log the user in immediately after successful registration
        req.login(user, (err) => {
            if (err) {
                console.error('Error logging in after registration:', err);
                return res.status(500).json({ message: 'Error logging in after registration.' });
            }
            res.status(201).json({ message: 'User registered and logged in successfully! 🎉', user: { id: user._id, email: user.email } });
        });
    } catch (err) {
        console.error('Server error during registration:', err);
        // Mongoose validation errors or other server issues
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// Login user with email and password
app.post('/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Passport local authentication error:', err);
            return next(err); // Pass error to Express error handler
        }
        if (!user) {
            return res.status(400).json({ message: info.message }); // Authentication failed (e.g., incorrect credentials)
        }
        // Log the user in
        req.logIn(user, (err) => {
            if (err) {
                console.error('Error logging in:', err);
                return next(err);
            }
            res.json({ message: 'Logged in successfully! 👋', user: { id: user._id, email: user.email } });
        });
    })(req, res, next);
});

// Logout user
app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => { // Passport's logout method
        if (err) {
            console.error('Error logging out:', err);
            return next(err);
        }
        // Destroy the session and clear the session cookie
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return next(err);
            }
            res.clearCookie('connect.sid'); // Clear the session cookie from the client
            res.json({ message: 'Logged out successfully! 🚪' });
        });
    });
});

// GitHub OAuth initiation
app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email', 'read:user'] }) // Request email and public profile data
);

// GitHub OAuth callback
app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: 'http://localhost:5173/login' }), // Redirect to frontend login on failure
    (req, res) => {
        // Successful authentication, redirect to frontend dashboard
        res.redirect('http://localhost:5173/dashboard');
    }
);

// Get current user details (for frontend to check login status and display info)
app.get('/auth/current_user', (req, res) => {
    if (req.isAuthenticated()) {
        // If user is authenticated, return relevant user data
        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                displayName: req.user.displayName,
                profilePicture: req.user.profilePicture
            }
        });
    } else {
        res.json({ user: null }); // User is not logged in
    }
});

// Middleware to ensure a user is authenticated for protected routes
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next(); // User is logged in, proceed
    }
    res.status(401).json({ message: 'Please log in to access this resource. 🔒' });
};

// --- URL Shortening & Management Routes ---

/**
 * Generates a unique short code using UUID v4 and checks for collision in the database.
 * Retries multiple times if a collision occurs.
 * @returns {Promise<string>} A unique 8-character short code.
 * @throws {Error} If a unique code cannot be generated after multiple attempts.
 */
const generateUniqueShortCode = async () => {
    let attempts = 0;
    const maxAttempts = 5; // Limit attempts to prevent infinite loops

    while (attempts < maxAttempts) {
        // Generate a UUID v4, remove hyphens, and take the first 8 characters
        const code = uuidv4().replace(/-/g, '').substring(0, 8);
        const existingUrl = await Url.findOne({ shortCode: code });
        if (!existingUrl) {
            return code; // Found a unique code
        }
        attempts++;
    }
    throw new Error('Could not generate a unique short code after multiple attempts. Please try again later. 😟');
};

// Shorten a URL (can be used by both logged-in and anonymous users)
app.post('/api/shorten', async (req, res) => {
    const { originalUrl, customAlias } = req.body;
    // Get user ID if logged in, otherwise null
    const userId = req.isAuthenticated() ? req.user.id : null;

    if (!originalUrl) {
        return res.status(400).json({ message: 'Original URL is required. Please provide a link. 🔗' });
    }

    let shortCode;
    if (customAlias) {
        // Validate custom alias format
        if (!/^[a-zA-Z0-9_-]{4,15}$/.test(customAlias)) {
            return res.status(400).json({ message: 'Custom alias must be 4-15 alphanumeric characters, hyphens, or underscores. 📝' });
        }
        shortCode = customAlias;
    } else {
        // Generate a unique short code if no custom alias is provided
        try {
            shortCode = await generateUniqueShortCode();
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    try {
        // Check if the generated or custom short code already exists
        const existingShortUrl = await Url.findOne({ shortCode });
        if (existingShortUrl) {
            return res.status(409).json({ message: 'This custom alias or generated short code is already in use. Please choose another or try again. 🚫' });
        }

        // Create and save the new URL entry
        const newUrl = new Url({
            originalUrl,
            shortCode,
            user: userId, // Link to user if authenticated
        });
        await newUrl.save();

        res.status(201).json({
            message: 'URL shortened successfully! ✨',
            shortUrl: `${process.env.BASE_URL}/${shortCode}`, // Full shortened URL
            originalUrl: newUrl.originalUrl,
            customAlias: newUrl.shortCode,
            clicks: newUrl.clicks,
            createdAt: newUrl.createdAt
        });
    } catch (error) {
        console.error('Error shortening URL:', error);
        res.status(500).json({ message: 'Internal server error while processing your request. ⚙️' });
    }
});

// Get all shortened URLs for the authenticated user
app.get('/api/my-urls', ensureAuthenticated, async (req, res) => {
    try {
        // Find URLs associated with the current user, sorted by creation date
        const urls = await Url.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(urls.map(url => ({
            id: url._id,
            originalUrl: url.originalUrl,
            shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
            customAlias: url.shortCode,
            clicks: url.clicks,
            createdAt: url.createdAt
        })));
    } catch (error) {
        console.error('Error fetching user URLs:', error);
        res.status(500).json({ message: 'Internal server error while fetching your URLs. 🤕' });
    }
});

// Delete a shortened URL belonging to the authenticated user
app.delete('/api/urls/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        // Find and delete the URL, ensuring it belongs to the current user
        const url = await Url.findOneAndDelete({ _id: id, user: req.user.id });

        if (!url) {
            return res.status(404).json({ message: 'URL not found or you do not have permission to delete it. 🛡️' });
        }
        res.json({ message: 'URL deleted successfully! ✅' });
    } catch (error) {
        console.error('Error deleting URL:', error);
        res.status(500).json({ message: 'Internal server error while deleting URL. 🗑️' });
    }
});

// --- Redirection Endpoint ---
// Handles redirection for all short codes (publicly accessible)
app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    try {
        const urlEntry = await Url.findOne({ shortCode });

        if (urlEntry) {
            // Increment click count asynchronously for performance
            // Consider using a message queue for high-traffic scenarios
            urlEntry.clicks++;
            urlEntry.save().catch(err => console.error('Failed to increment click count:', err)); // Log error, but don't block redirect
            return res.redirect(301, urlEntry.originalUrl); // Use 301 Permanent Redirect
        } else {
            // If short code not found, redirect to a custom 404 page or show a message
            return res.status(404).send('Short URL not found. It might be invalid or expired. 😔');
        }
    } catch (error) {
        console.error('Error during URL redirection:', error);
        res.status(500).send('Internal server error during redirection. 💥');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} 🚀`);
});