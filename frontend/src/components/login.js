import React from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function LoginButton() {
  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  return (
      <button className="custom-button" onClick={handleLogin}>
        Login with Google
      </button>
  );
}

export default LoginButton;
