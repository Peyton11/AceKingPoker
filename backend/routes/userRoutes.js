const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.userId]);

    res.json(user.rows[0]);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
