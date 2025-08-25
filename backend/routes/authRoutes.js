const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "Strict" });
      const redirectUrl = new URL("/home", process.env.CLIENT_URL).toString();
      res.redirect(redirectUrl);
  }
);

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  req.logout(() => res.redirect(process.env.CLIENT_URL));
});

module.exports = router;
