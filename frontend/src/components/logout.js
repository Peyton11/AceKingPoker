import React from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function LogoutButton() {
  const handleLogout = () => {
    window.location.href = `${BACKEND_URL}/auth/logout`;
  };

  return (
      <button onClick={handleLogout}>Logout</button>
  );
}

export default LogoutButton;
