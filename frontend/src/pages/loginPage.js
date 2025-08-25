import React from "react";
import LoginButton from "../components/login";
import "../styles/custom-theme.css";
import logo from "../AceKingLogo.png";

function LoginPage() {
  return (
    <main
      className="centered-content"
      style={{
        backgroundColor: "var(--primary-color)",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <img
        src={logo}
        alt="Ace King Logo"
        style={{
          maxWidth: "90%",
          width: "300px",
          marginBottom: "20px",
        }}
      />

      <h2 className="themed-subtitle">Play Smart. Win Big.</h2>

      <LoginButton />

      <p style={{ color: "var(--accent-color)", marginTop: "15px", fontSize: "0.9rem" }}>
        Secure login powered by Google
      </p>
    </main>
  );
}

export default LoginPage;
