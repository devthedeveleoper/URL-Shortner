// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }
            if (!user.password) {
                return done(null, false, { message: 'This email is registered via GitHub. Please use GitHub login.' });
            }
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/github/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ githubId: profile.id });

            if (user) {
                // If user exists, update their display name and profile picture just in case
                // They might have changed it on GitHub
                user.displayName = profile.displayName || profile.username;
                user.profilePicture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
                await user.save();
                return done(null, user);
            } else {
                let emailFromGithub = null;
                if (profile.emails && profile.emails.length > 0) {
                    emailFromGithub = profile.emails[0].value;
                }

                if (emailFromGithub) {
                    const existingUserByEmail = await User.findOne({ email: emailFromGithub });
                    if (existingUserByEmail) {
                        // Link GitHub to existing local account
                        existingUserByEmail.githubId = profile.id;
                        existingUserByEmail.displayName = profile.displayName || profile.username;
                        existingUserByEmail.profilePicture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
                        await existingUserByEmail.save();
                        return done(null, existingUserByEmail);
                    }
                }

                // Create a new user with GitHub ID
                const newUser = new User({
                    githubId: profile.id,
                    email: emailFromGithub,
                    displayName: profile.displayName || profile.username, // Store display name
                    profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null // Store profile picture URL
                });
                await newUser.save();
                return done(null, newUser);
            }
        } catch (err) {
            return done(err);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};