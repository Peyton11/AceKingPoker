import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const useSocket = (gameId, playerId, password = null) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState(null);
    const [handResult, setHandResult] = useState(null);
    const [queued, setQueued] = useState(false); // rename to make it clear

    useEffect(() => {
        const newSocket = io(process.env.REACT_APP_BACKEND_URL, {
            withCredentials: true,
        });

        newSocket.on("connect", () => {
            console.log("Connected to server", newSocket.id);
            setIsConnected(true);
        });

        newSocket.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        newSocket.on("gameUpdate", (gameData) => {
            console.log("Received gameUpdate", gameData);
            setGameState(gameData);
            // IMPORTANT: If you are now in players, clear queued
            if (playerId && gameData.players.some(p => p.id === playerId)) {
                setQueued(false);
            }
        });

        newSocket.on("handEnded", ({ winner, chipsWon, winningCards, winningRank }) => {
            setHandResult({ winner, chipsWon, winningCards, winningRank });
            setTimeout(() => setHandResult(null), 5000); // clear after 5s
        });

        newSocket.on("error", (err) => {
            console.error("Error:", err);
            setError(err.message);

            if (err.message === 'Game not found for gameID' || err.message === 'You cannot reconnect to the game at this time.') {
                localStorage.removeItem("poker:gameId");
                localStorage.removeItem("poker:joinPassword");
                setTimeout(() => {
                    window.location.reload();
                }, 2000); // 2s refresh
            }

            setTimeout(() => setError(null), 5000); // clear after 5s
        });

        newSocket.on("queued", () => {
            console.log("Received queued event");
            setQueued(true);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []); // Only once

    const sendAction = (action, amount = 0) => {
        if (socket) {
            socket.emit("playerAction", { gameId, playerId, action, amount });
        }
    };

    const addCPU = () => {
        if (socket) {
            socket.emit("addCPU", { gameId });
        }
    };

    const removeCPU = () => {
        if (socket) {
            socket.emit("removeCPU", { gameId });
        }
    };

    const leaveQueue = () => {
        if (socket) {
            socket.emit("leaveQueue", { gameId, playerId });
            setQueued(false);
        }
    };

    // 🧠 here: **being inQueue depends on (queued === true) and you're not in game.players**
    const inQueue = queued && (!gameState || !gameState.players.some(p => p.id === playerId));

    return { gameState, sendAction, addCPU, removeCPU, error, handResult, socket, inQueue, leaveQueue };
};

export default useSocket;
