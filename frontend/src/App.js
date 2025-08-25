import React from "react";
import LoginPage from "./pages/loginPage";
import GameLobby from "./pages/Game";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LogoutButton from "./components/logout";
import Terminology from "./pages/Terminology";
import Stats from "./pages/Stats";
import HowToPlay from "./pages/HowToPlay";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<GameLobby />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/terminology" element={<Terminology />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
      </Routes>
    </Router>
  );
}

export default App;
