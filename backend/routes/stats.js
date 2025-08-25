const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Import from config/db.js

// Fetch player stats by user ID
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM player_stats WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No stats found for this user." });
        }

        res.json(result.rows[0]); // Send player stats
    } catch (error) {
        console.error("Error fetching player stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
