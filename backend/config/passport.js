require('dotenv').config(); // Load .env file variables

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const pool = require('../config/db'); // PostgreSQL connection
const BASE_URL = (process.env.REACT_APP_BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);

        if (user.rows.length === 0) {
            user = await pool.query(
                `INSERT INTO users (google_id, email, name, picture) VALUES ($1, $2, $3, $4) RETURNING *`,
                [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0].value]
            );
        }

        return done(null, user.rows[0]);
    } catch (err) {
        console.error('Error during Google login:', err);
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, user.rows[0]);
    } catch (err) {
        done(err, null);
    }
});
