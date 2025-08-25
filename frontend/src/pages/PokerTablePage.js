// src/pages/PokerTablePage.jsx
import React, { useEffect, useState } from "react";
import "../styles/custom-theme.css";

const PokerTablePage = ({ gameState, sendAction, playerId, handResult }) => {
    const [chatBubbles, setChatBubbles] = useState({});
    const [tableMessage, setTableMessage] = useState(null);
    const [animatedPot, setAnimatedPot] = useState(0);

    const showChatBubble = (playerId, message) => {
        setChatBubbles(prev => ({ ...prev, [playerId]: message }));
        setTimeout(() => {
            setChatBubbles(prev => {
                const updated = { ...prev };
                delete updated[playerId];
                return updated;
            });
        }, 5000);
    };

    const handleAction = (action, amount = null) => {
        if (action === "call") showChatBubble(playerId, "Call");
        else if (action === "check") showChatBubble(playerId, "Check");
        else if (action === "raise") showChatBubble(playerId, "Raise $10");
        else if (action === "fold") showChatBubble(playerId, "Fold");
        else if (action === "startGame") {
            setTableMessage("Starting game...");
            setTimeout(() => setTableMessage(null), 5000);
        }

        if (amount !== null) {
            sendAction(action, amount);
        } else {
            sendAction(action);
        }
    };

    useEffect(() => {
        if (!gameState) return;
        const interval = setInterval(() => {
            setAnimatedPot(prev => {
                if (prev < gameState.pot) {
                    return prev + Math.ceil((gameState.pot - prev) / 5);
                }
                return gameState.pot;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [gameState?.pot]);

    if (!gameState) {
        return <div className="table-loading">Loading table...</div>;
    }

    const players = gameState.players || [];
    const yourPlayer = players.find(p => p.id === playerId) || {};
    const currentTurn = gameState.currentTurn;
    const playerSpots = Array(8).fill(null).map((_, i) => players[i] || null);

    const isYourTurn = players[currentTurn]?.id === playerId;
    const lastBet = gameState.lastBet || 0;
    const yourBet = yourPlayer.betThisRound || 0;
    const yourChips = yourPlayer.chips || 0;

    const canCall = isYourTurn && !yourPlayer.folded && (lastBet === yourBet || (lastBet > yourBet && (lastBet - yourBet) <= yourChips));
    const canRaise = isYourTurn && !yourPlayer.folded && (lastBet + 10 > yourBet) && ((lastBet + 10) - yourBet <= yourChips);
    const canFold = isYourTurn && !yourPlayer.folded;
    const canStart = gameState.round === "waiting";

    const callLabel = lastBet > yourBet ? `Call $${lastBet - yourBet}` : "Check";

    const revealedCount = {
        preflop: 0,
        flop: 3,
        turn: 4,
        river: 5,
        showdown: 5
    }[gameState.round] || 0;

    const imageUrlForCard = (card) => `/cards/${card.rank}_of_${card.suit.toLowerCase()}.png`;

    const FlipCard = ({ card, revealed }) => (
        <div className={`flip-card ${revealed ? "reveal" : ""}`}>
            <div className="flip-card-inner">
                <div className="flip-card-front">
                    <img src="/cards/back_of_card.png" alt="Card Back" className="card-image" />
                </div>
                <div className="flip-card-back">
                    <img src={imageUrlForCard(card)} alt={`${card.rank} of ${card.suit}`} className="card-image" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="dark-table-wrapper">
            <div className="themed-box text-center px-4 py-3" style={{ width: '100%', maxWidth: '1100px' }}>
                <div className="pot-display mb-3">🪙 Pot: ${animatedPot}</div>

                <div className="poker-table mx-auto">
                    {tableMessage && <div className="table-center-message">{tableMessage}</div>}

                    {playerSpots.map((player, i) => (
                        <div key={i} className={`player-spot spot-${i}`}>
                            {player ? (
                                <div className={`player-box ${i === currentTurn ? "active" : ""} ${player.folded ? "folded" : ""}`}>
                                    {gameState.dealerPosition === i && <div className="dealer-button">D</div>}
                                    {chatBubbles[player.id] && <div className="chat-bubble">{chatBubbles[player.id]}</div>}
                                    {player.folded ? (
                                        <div>Folded</div>
                                    ) : (
                                        <>
                                            <div>{player.id}</div>
                                            <div>💰 {player.chips}</div>
                                            <div>Bet: ${player.betThisRound || 0}</div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="empty-spot"></div>
                            )}
                        </div>
                    ))}

                    <div className="community-cards">
                        {[0, 1, 2, 3, 4].map(index => (
                            <FlipCard
                                key={index}
                                card={gameState.communityCards[index] || { rank: "2", suit: "hearts" }}
                                revealed={index < revealedCount}
                            />
                        ))}
                    </div>
                </div>

                <div className="player-controls mt-4">
                    <h4>Your Cards</h4>
                    <div className="cards-row mb-3">
                        {gameState.yourCards?.map((card, i) => (
                            <img key={i} src={imageUrlForCard(card)} alt="Your Card" className="card-image" />
                        ))}
                    </div>

                    <div className="action-buttons">
                        <button disabled={!canStart} onClick={() => handleAction("startGame")} className="styled-action-button">Start Game</button>
                        <button disabled={!canFold} onClick={() => handleAction("fold")} className="styled-action-button">Fold</button>
                        <button disabled={!canCall} onClick={() => handleAction("call")} className="styled-action-button">{callLabel}</button>
                        <button disabled={!canRaise} onClick={() => handleAction("raise", 10)} className="styled-action-button">Raise $10</button>
                    </div>

                    {handResult && (
                        <div className="hand-result mt-4">
                            🏆 Player {handResult.winner} won {handResult.chipsWon} chips!
                            {handResult.winningRank && <div>Hand: <strong>{handResult.winningRank} hand</strong></div>}
                            {handResult.winningCards && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                    {handResult.winningCards.map((card, index) => (
                                        <FlipCard card={card} revealed={true} key={index} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PokerTablePage;
