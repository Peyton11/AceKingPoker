// src/pages/HowToPlay.jsx
import React from 'react';
import NavigationBar from '../components/Navbar';

const HowToPlay = () => {
    return (
        <div className="bg-light min-vh-100">
            <NavigationBar />

            <div className="container d-flex flex-column justify-content-center align-items-center mt-5">
                <h1 className="display-4 fw-bold text-primary mb-4">How to Play Poker</h1>

                <h2 className="text-secondary mb-3">Objective</h2>
                <p className="text-center mb-4">
                    In Texas Hold'em, the goal is to form the best five-card poker hand using any combination of your two hole cards and five community cards — or to get all other players to fold before showdown.
                </p>

                <h2 className="text-secondary mb-3">Game Flow</h2>
                <ol className="text-start mb-4">
                    <li><strong>Blinds Posted:</strong> Two players post small and big blinds to start the betting.</li>
                    <li><strong>Hole Cards Dealt:</strong> Each player receives two private cards.</li>
                    <li><strong>Pre-Flop:</strong> Players take turns betting, starting with the one left of the big blind.</li>
                    <li><strong>Flop:</strong> Three community cards are dealt face up, followed by a betting round.</li>
                    <li><strong>Turn:</strong> A fourth community card is dealt. Another round of betting follows.</li>
                    <li><strong>River:</strong> The final community card is dealt. Final round of betting.</li>
                    <li><strong>Showdown:</strong> Players reveal their hands and the best one wins the pot.</li>
                </ol>

                <h2 className="text-secondary mb-3">Helpful Reminders</h2>
                <ul className="text-start mb-4">
                    <li>You don’t need to use both hole cards — any combination works.</li>
                    <li>You can win a hand without showing your cards if everyone else folds.</li>
                    <li>The pot goes to the best hand if multiple players reach showdown.</li>
                    <li>Position and patience matter — don't play every hand.</li>
                </ul>

                <p className="mt-4 text-muted">For definitions of actions and terms, see the Terminology page.</p>
            </div>
        </div>
    );
};

export default HowToPlay;
