// src/pages/Game.jsx
import React, { useEffect, useRef, useState } from "react";
import useSocket from "../hooks/useSocket";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/custom-theme.css';
import NavigationBar from "../components/Navbar";
import AceKingLogo from '../AceKingLogoNoWords.png';
import Queue from "./Queue";
import PokerTablePage from "./PokerTablePage";

const Game = () => {
    // Add near the top, after the state declarations
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const [gameId, setGameId] = useState(null);
    const [inputGameId, setInputGameId] = useState("");
    const [createName, setCreateName] = useState("");
    const [createPassword, setCreatePassword] = useState("");
    const [createBuyIn, setCreateBuyIn] = useState(0);
    const [games, setGames] = useState([]);
    const [joinPassword, setJoinPassword] = useState("");
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState("");
    const [userTotalChips, setUserTotalChips] = useState(0);
    const [joinError, setJoinError] = useState(null);

    const { gameState, sendAction, addCPU, removeCPU, error, handResult, socket, inQueue, leaveQueue } = useSocket(gameId, userId, joinPassword);
    const chipUpdateInProgress = useRef(false);
    const canManageCPUs = gameState?.round === 'waiting' && !inQueue && gameState?.players?.some(p => p.id === userId);


    useEffect(() => {
        const handleUnload = () => {
            localStorage.removeItem('poker:userName');
            localStorage.removeItem('poker:userTotalChips');
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    useEffect(() => {
        const savedGame = localStorage.getItem("poker:gameId");
        const savedPass = localStorage.getItem("poker:joinPassword");
        if (savedGame) {
            setJoinPassword(savedPass || "");
            setGameId(savedGame);
        }
    }, []);

    useEffect(() => {
        fetch(`${BACKEND_URL}/user`, { credentials: "include" })
            .then(res => res.status === 401 ? null : res.json())
            .then(data => data && setUserId(data.id))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!userId) return;
        const cachedName = localStorage.getItem('poker:userName');
        const cachedChips = localStorage.getItem('poker:userTotalChips');

        if (cachedName) setUserName(cachedName);
        else {
            fetch(`${BACKEND_URL}/user/${userId}/name`, { credentials: "include" })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        setUserName(data.name);
                        localStorage.setItem('poker:userName', data.name);
                    }
                })
                .catch(console.error);
        }

        if (cachedChips) setUserTotalChips(Number(cachedChips));

        const fetchAndUpdateChips = () => {
            fetch(`${BACKEND_URL}/user/${userId}/chips`, { credentials: "include" })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        setUserTotalChips(data.chipAmt);
                        localStorage.setItem('poker:userTotalChips', data.chipAmt);
                    }
                })
                .catch(console.error);
        };

        fetchAndUpdateChips();
        const interval = setInterval(fetchAndUpdateChips, 30000);
        return () => clearInterval(interval);

    }, [userId]);

    useEffect(() => {
        if (userName && userTotalChips) {
            console.log(`✅ Final user info ready: ${userName} (${userTotalChips} chips)`);
        }
    }, [userName, userTotalChips]);

    const loadGames = () => {
        fetch(`${BACKEND_URL}/api/games`)
            .then(res => res.json())
            .then(setGames)
            .catch(console.error);
    };
    useEffect(loadGames, []);

    const handleCreateGame = async () => {
        const newGameId = `game_${Date.now()}`;
        try {
            const res = await fetch(`${BACKEND_URL}/api/create-game`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({
                    gameId: newGameId,
                    tableName: createName,
                    password: createPassword || undefined,
                    buyIn: Number(createBuyIn)
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Create game failed:", data?.message);
                setJoinError(data?.message || "Failed to create game.");
                setTimeout(() => setJoinError(null), 5000);
                return;
            }

            // 🧹 Only save gameId if it successfully created!
            setJoinPassword(createPassword);
            setGameId(newGameId);
            localStorage.setItem("poker:gameId", newGameId);
            localStorage.setItem("poker:joinPassword", createPassword);
            loadGames();
            if (socket) {
                handleJoinGame(newGameId, !!createPassword);
            } else {
                console.error("Socket not ready, cannot auto-join game.");
            }

        } catch (error) {
            console.error("Unexpected error creating game:", error);
            setJoinError("Unexpected server error. Please try again.");
            setTimeout(() => setJoinError(null), 5000);
        }
    };


    const handleJoinGame = (id, needsPassword) => {
        if (needsPassword && !joinPassword) {
            setJoinError("Please enter table password");
            return;
        }

        if (!socket) {
            console.error("Socket not connected yet.");
            return;
        }

        // Always save gameId immediately
        setGameId(id);
        localStorage.setItem("poker:gameId", id);
        localStorage.setItem("poker:joinPassword", joinPassword);

        const handleSuccess = (gameData) => {
            console.log("Successfully joined game:", id);

            socket.off("gameUpdate", handleSuccess);
            socket.off("error", handleError);
        };

        const handleError = (err) => {
            console.error("Failed to join game:", err.message);
            setJoinError(err.message || "Failed to join game.");

            // Clean up localStorage if error
            localStorage.removeItem("poker:gameId");
            localStorage.removeItem("poker:joinPassword");

            socket.off("gameUpdate", handleSuccess);
            socket.off("error", handleError);

            setTimeout(() => setJoinError(null), 5000);
        };

        socket.once("gameUpdate", handleSuccess);
        socket.once("error", handleError);

        console.log("Attempting to join game:", id);
        socket.emit("joinGame", { gameId: id, playerId: userId, password: joinPassword });
    };



    const handleLeaveGame = async () => {
        if (socket) {
            socket.emit("leaveGame");
        }
        localStorage.removeItem("poker:gameId");
        localStorage.removeItem("poker:joinPassword");
        setGameId(null);
        setJoinPassword("");

        if (userId && !chipUpdateInProgress.current) {
            chipUpdateInProgress.current = true;
            try {
                const res = await fetch(`${BACKEND_URL}/user/${userId}/chips`, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setUserTotalChips(data.chipAmt);
                    localStorage.setItem('poker:userTotalChips', data.chipAmt);
                }
            } catch (error) {
                console.error(error);
            } finally {
                chipUpdateInProgress.current = false;
            }
        }
    };

    const handleAddCPU = () => addCPU();
    const handleRemoveCPU = () => removeCPU();

    return (
        <div className="bg-light min-vh-100 d-flex flex-column">
            <NavigationBar userName={userName} userTotalChips={userTotalChips} />
            <div className="container flex-grow-1 d-flex flex-column py-4">
                {/* Show logo ONLY when no game is joined */}
                {!gameId && (
                    <>
                        {joinError && (
                            <div className="alert alert-danger text-center" role="alert">
                                {joinError}
                            </div>
                        )}
                        <img src={AceKingLogo} alt="Logo" className="mx-auto mb-4" style={{ width: 180 }} />
                        <div className="row g-4">
                            <div className="col-md-6">
                                <div className="content-box">
                                    <h3 className="themed-title">Create Table</h3>
                                    <input className="form-control mb-3" placeholder="Table Name"
                                           value={createName} onChange={e => setCreateName(e.target.value)} />
                                    <input type="password" className="form-control mb-3" placeholder="Password (optional)"
                                           value={createPassword} onChange={e => setCreatePassword(e.target.value)} />
                                    <input type="number" className="form-control mb-3" placeholder="Buy-In Amount"
                                           value={createBuyIn} onChange={e => setCreateBuyIn(e.target.value)} />
                                    <button
                                    className="styled-action-button w-100 d-flex align-items-center justify-content-center"
                                    onClick={handleCreateGame}
                                    disabled={!socket?.connected || createBuyIn > userTotalChips || createBuyIn < 0}
                                    >
                                    {!socket?.connected ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                            Connecting...
                                        </>
                                    ) : createBuyIn > userTotalChips ? (
                                        `Not Enough Chips (${userTotalChips})`
                                    ) : (
                                        '🎮 Create & Join Table'
                                    )}
                                    </button>

                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="content-box">
                                    <h3 className="themed-title">Browse Tables</h3>
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-striped table-dark text-light">
                                            <thead>
                                            <tr>
                                                <th>Name</th><th>Players</th><th>Buy-In</th><th>Locked</th><th>Status</th><th></th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {games.map(g => (
                                                <tr key={g.gameId}>
                                                    <td>{g.tableName}</td>
                                                    <td>{g.players}/{g.maxPlayers}</td>
                                                    <td>{g.buyIn}</td>
                                                    <td>{g.passwordProtected ? '🔒' : '-'}</td>
                                                    <td>{g.status}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
                                                            onClick={() => handleJoinGame(g.gameId, g.passwordProtected)}
                                                            disabled={!socket?.connected || userTotalChips < g.buyIn}
                                                        >
                                                            {!socket?.connected ? (
                                                                <>
                                                                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                                                    Connecting...
                                                                </>
                                                            ) : userTotalChips < g.buyIn ? (
                                                                "Not Enough Chips"
                                                            ) : (
                                                                "Join"
                                                            )}
                                                        </button>


                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <input
                                        type="password"
                                        className="form-control mt-2"
                                        placeholder="Password for Locked Table"
                                        value={joinPassword}
                                        onChange={e => setJoinPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {gameId && (
                    <div className="mt-4 text-center">
                        {gameState && gameState.players.some(p => p.id === userId) && (
                            <button className="btn btn-danger mb-3" onClick={handleLeaveGame}>
                                Leave Table
                            </button>
                        )}
                        <br/>
                        {canManageCPUs && (
                            <>
                                <button className="styled-action-button" onClick={handleAddCPU}>Add CPU</button>
                                <button className="styled-action-button" onClick={handleRemoveCPU}>Remove CPU</button>
                            </>
                        )}
                        {error && <div className="alert alert-danger">{error}</div>}
                        {inQueue ? (
                            <Queue
                                socket={socket}
                                leaveQueue={() => {
                                    leaveQueue();
                                    localStorage.removeItem("poker:gameId");
                                    localStorage.removeItem("poker:joinPassword");
                                    setGameId(null);
                                    setJoinPassword("");
                                }}
                            />
                        ) : gameState && gameState.players.some(p => p.id === userId) ? (
                            <PokerTablePage
                                gameState={gameState}
                                sendAction={sendAction}
                                playerId={userId}
                                handResult={handResult}
                            />
                        ) : (
                            <div className="text-center mt-5">
                                <h2>Loading game...</h2>
                            </div>
                        )}



                    </div>
                )}
            </div>
        </div>
    );
};

export default Game;
