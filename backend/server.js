require("dotenv").config();
const express = require('express');
const passport = require("passport");
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis'); // <-- updated redis client
const { Pool } = require('pg');
const cookieParser = require("cookie-parser");
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
require("./config/passport");
const { GameController } = require('./controllers/GameController');
const bodyParser = require("body-parser");
const statsRoutes = require("./routes/stats");

const app = express();
const server = http.createServer(app);

// Clean env var
const cleanOrigin = (process.env.CLIENT_URL || "").replace(/\/$/, "");

// Setup Socket.IO
const io = socketIo(server, {
    cors: {
        origin: cleanOrigin,
        credentials: true,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
    },
});

// PostgreSQL setup
const pgPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

const redis = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    },
    password: process.env.REDIS_PASSWORD,
});

// Connect to Redis
redis.connect()
    .then(() => console.log('✅ Connected to Redis Cloud!'))
    .catch(err => {
        console.error('❌ Redis Connection Error:', err);
        process.exit(1);
    });

// Game Controller
const gameController = new GameController(io, redis, pgPool);

// Express middlewares
app.use(express.json());
app.use(cors({
    origin: cleanOrigin,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/stats", statsRoutes);

// Socket.IO
io.on("connection", (socket) => {
    console.log("A user connected (Their socket ID is):", socket.id);


    socket.on("joinGame", async ({ gameId, playerId, password }) => {
        try {
            const gameData = await redis.get(`game:${gameId}`);
            if (!gameData) {
                return socket.emit("error", { message: `Game not found for gameID` });
            }
            const game = JSON.parse(gameData);

            let amtOfConnectedPlayers = game.players.filter(p => !p.leftGame).length;

            const totalPlayers = amtOfConnectedPlayers + game.queuedPlayers.length;
            if (totalPlayers >= game.meta.maxPlayers) {
                return socket.emit("error", { message: "This table is full!" });
            }

            // Password check
            if (game.meta.password && password !== game.meta.password) {
                return socket.emit("error", { message: "Incorrect table password" });
            }

            // Already in game?
            const alreadyInGame = game.players.some(p => p.id === playerId);
            if (alreadyInGame) {
                return socket.emit("error", { message: "You cannot reconnect to the game at this time." });
            }

            // Buy-in enforcement
            const buyIn = game.meta.buyIn || 0;
            if (buyIn > 0) {
                const { rows } = await pgPool.query(
                    "SELECT chips FROM player_stats WHERE id = $1",
                    [playerId]
                );
                if (!rows.length) {
                    return socket.emit("error", { message: "User not found." });
                }
                const userChips = rows[0].chips;
                if (userChips < buyIn) {
                    return socket.emit("error", { message: "Not enough chips for buy-in." });
                }
                await pgPool.query(
                    "UPDATE player_stats SET chips = chips - $1 WHERE id = $2",
                    [buyIn, playerId]
                );
            }

            // Add player to game
            if (game.round === "waiting") {
                game.players.push({
                    id: playerId,
                    chips: buyIn,
                    cards: [],
                    isCPU: false,
                    stats: {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        totalChipsWon: 0,
                        handsPlayed: 0,
                        handsWon: 0,
                        allIns: 0,
                        folds: 0
                    }
                });
            } else {
                game.queuedPlayers.push({
                    id: playerId,
                    chips: buyIn,
                    cards: [],
                    isCPU: false,
                    stats: {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        totalChipsWon: 0,
                        handsPlayed: 0,
                        handsWon: 0,
                        allIns: 0,
                        folds: 0
                    }
                });
            }


            await redis.set(`game:${gameId}`, JSON.stringify(game));

            socket.join(gameId);
            socket.join(playerId);
            socket.gameId = gameId;
            socket.playerId = playerId;

            if(game.round !== "waiting"){
                socket.emit("queued");
                console.log(`Player ${playerId} queued for game ${gameId}`);
            }
            else {
                console.log(`Player ${playerId} joined game ${gameId}`);
            }

            await gameController.updateAllPlayers(gameId);

        } catch (error) {
            console.error("Join Game Error:", error);
            socket.emit("error", { message: "Error joining game" });
        }
    });

    socket.on("addCPU", async ({ gameId }) => {
        try {
            const gameData = await redis.get(`game:${gameId}`);
            if (!gameData) {
                return socket.emit("error", { message: "Game not found" });
            }

            const game = JSON.parse(gameData);

            // Generate a unique CPU ID
            const cpuId = `cpu_${game.players.filter(p => p.isCPU).length + 1}`;

            // Add the CPU player to the game
            const buyIn = game.meta.buyIn || 0;
            game.players.push({
                id: cpuId,
                chips: buyIn,
                cards: [],
                isCPU: true
            });

            // Save the updated game back to Redis
            await redis.set(`game:${gameId}`, JSON.stringify(game));

            // Notify all players about the updated game state
            await gameController.updateAllPlayers(gameId);

            console.log(`CPU ${cpuId} added to game ${gameId}`);
        } catch (error) {
            console.error("Error adding CPU player:", error);
            socket.emit("error", { message: "Failed to add CPU player" });
        }
    });

    socket.on("removeCPU", async ({ gameId }) => {
        try {
            const gameData = await redis.get(`game:${gameId}`);
            if (!gameData) {
                return socket.emit("error", { message: "Game not found" });
            }

            const game = JSON.parse(gameData);

            // Count the number of CPU players
            const cpuCount = game.players.filter(p => p.isCPU).length;
            if (cpuCount === 0) {
                return socket.emit("error", { message: "No CPU players found in the game" });
            }

            // Construct the ID of the most recently added CPU
            const mostRecentCPUId = `cpu_${cpuCount}`;

            // Remove the CPU player with the constructed ID
            game.players = game.players.filter(p => p.id !== mostRecentCPUId);

            // Save the updated game back to Redis
            await redis.set(`game:${gameId}`, JSON.stringify(game));

            // Notify all players about the updated game state
            await gameController.updateAllPlayers(gameId);

            console.log(`CPU ${mostRecentCPUId} removed from game ${gameId}`);
        } catch (error) {
            console.error("Error removing CPU player:", error);
            socket.emit("error", { message: "Failed to remove CPU player" });
        }
    });

    socket.on("playerAction", async ({ gameId, playerId, action, amount }) => {
        try {
            const game = JSON.parse(await redis.get(`game:${gameId}`));
            if (!game) return socket.emit("error", { message: "Game not found" });

            const player = game.players.find(p => p.id === playerId);
            if (!player) return socket.emit("error", { message: "Invalid Player ID" });

            if (action === "startGame") {
                await gameController.startGame(gameId);
            } else {
                await gameController.playerAction(gameId, playerId, action, amount);
            }
        } catch (error) {
            console.error("Player Action Error:", error);
            socket.emit("error", { message: "Error processing action" });
        }
    });

    socket.on("leaveGame", async () => {
        console.log("Player left manually:", socket.id);
        const { gameId, playerId } = socket;
        if (!gameId || !playerId) return;

        try {
            const raw = await redis.get(`game:${gameId}`);
            if (!raw) return;
            const game = JSON.parse(raw);

            if (game.round === "waiting") {
                await handlePlayerLeave(socket);
                await checkAndDestroyEmptyGame(gameId);
                return;
            }

            const playerIndex = game.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) return;

            const player = game.players[playerIndex];

            if (!player.folded) {
                console.log(`Player ${playerId} left during game, forcing fold.`);
                player.folded = true;
                player.leftGame = true;
                game.activePlayers = game.activePlayers.filter(id => id !== playerId);

                await redis.set(`game:${gameId}`, JSON.stringify(game));
                await gameController.nextTurn(gameId);
            }
            socket.hasLeft = true;

            await checkAndDestroyEmptyGame(gameId);

        } catch (err) {
            console.error("Error handling leaveGame:", err);
        }
    });

    socket.on("leaveQueue", async ({ gameId, playerId }) => {
        try {
            const raw = await redis.get(`game:${gameId}`);
            if (!raw) return;

            const game = JSON.parse(raw);

            if (!game.queuedPlayers) {
                game.queuedPlayers = [];
            }

            const wasQueued = game.queuedPlayers.some(p => p.id === playerId);
            if (!wasQueued) {
                console.log(`Player ${playerId} tried to leave queue but was not queued.`);
                return;
            }

            // Remove player from queue
            game.queuedPlayers = game.queuedPlayers.filter(p => p.id !== playerId);

            // Refund buy-in
            const buyIn = game.meta.buyIn || 0;
            if (buyIn > 0) {
                await pgPool.query(
                    "UPDATE player_stats SET chips = chips + $1 WHERE id = $2",
                    [buyIn, playerId]
                );
                console.log(`Refunded ${buyIn} chips to player ${playerId} after leaving queue.`);
            }

            await redis.set(`game:${gameId}`, JSON.stringify(game));
            console.log(`Player ${playerId} left the queue for game ${gameId}`);
        } catch (error) {
            console.error("Error handling leaveQueue:", error);
        }
    });

    socket.on("disconnect", async () => {

        if (socket.hasLeft) {
            console.log(`Socket ${socket.id} already handled leave. Skipping disconnect logic.`);
            return;
        }
        console.log("Player disconnected immediately:", socket.id);
        const { gameId, playerId } = socket;
        if (!gameId || !playerId) return;

        try {
            const raw = await redis.get(`game:${gameId}`);
            if (!raw) return;
            const game = JSON.parse(raw);

            if (game.round === "waiting") {
                await handlePlayerLeave(socket);
                await checkAndDestroyEmptyGame(gameId);
                return;
            }

            const playerIndex = game.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) return;
            const player = game.players[playerIndex];

            if (!player.folded) {
                console.log(`Player ${playerId} disconnected during their turn, forcing fold.`);
                player.folded = true;
                player.leftGame = true;
                game.activePlayers = game.activePlayers.filter(id => id !== playerId);

                await redis.set(`game:${gameId}`, JSON.stringify(game));
                await gameController.nextTurn(gameId);
            }

            await checkAndDestroyEmptyGame(gameId);
        } catch (err) {
            console.error("Error handling disconnect:", err);
        }
    });

});

// Helper to destroy empty poker tables from redis DB
async function checkAndDestroyEmptyGame(gameId) {
    const raw = await redis.get(`game:${gameId}`);
    if (!raw) return;

    const game = JSON.parse(raw);
    const nonCPUPlayers = game.players.filter(p => !p.isCPU);

    if (nonCPUPlayers.length === 0) {
        console.log(`No real players left at ${gameId}, scheduling destroy.`);

        setTimeout(async () => {
            const recheckRaw = await redis.get(`game:${gameId}`);
            if (!recheckRaw) return;

            const recheck = JSON.parse(recheckRaw);
            const recheckNonCPU = recheck.players.filter(p => !p.isCPU);

            if (recheckNonCPU.length === 0) {
                console.log(`Destroying game ${gameId} (only CPUs or empty)`);
                await redis.del(`game:${gameId}`);
            } else {
                console.log(`Real players rejoined ${gameId}, canceling destroy.`);
            }
        }, 3000); // wait 3 seconds
    }
}

async function flushPlayerAndChips(player) {
    const userId = player.id;
    const stats = player.stats;

    if (!stats) {
        console.warn(`No stats found for user ${userId}, skipping flush.`);
        return;
    }

    try {
        await pgPool.query(
            `UPDATE player_stats
             SET
                 chips = chips + $1,
                 games_played = games_played + $2,
                 games_won = games_won + $3,
                 total_chips_won = total_chips_won + $4,
                 hands_played = hands_played + $5,
                 hands_won = hands_won + $6,
                 all_ins = all_ins + $7,
                 folds = folds + $8
             WHERE id = $9`,
            [
                player.chips || 0,
                stats.gamesPlayed || 0,
                stats.gamesWon || 0,
                stats.totalChipsWon || 0,
                stats.handsPlayed || 0,
                stats.handsWon || 0,
                stats.allIns || 0,
                stats.folds || 0,
                userId
            ]
        );
        console.log(`Successfully flushed chips and stats for user ${userId}`);
    } catch (err) {
        console.error(`Failed to flush chips and stats for user ${userId}:`, err);
    }
}


// Helper to refund chips and remove player
async function handlePlayerLeave(socket) {
    const { gameId, playerId } = socket;
    if (!gameId || !playerId) return;

    const raw = await redis.get(`game:${gameId}`);
    if (!raw) return;
    const game = JSON.parse(raw);

    const idx = game.players.findIndex(p => p.id === playerId);
    if (idx === -1) return;

    const player = game.players[idx];

    // Remove player from game
    game.players.splice(idx, 1);

    // Save updated game
    await redis.set(`game:${gameId}`, JSON.stringify(game));

    // Notify all players
    await gameController.updateAllPlayers(gameId);

    // Then flush database update in background
    flushPlayerAndChips(player).catch(err => console.error("Flush error:", err));
}


app.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// Get just the username
app.get('/user/:id/name', async (req, res) => {
    const playerId = req.params.id;

    try {
        const { rows } = await pgPool.query(
            "SELECT name FROM users WHERE id = $1",
            [playerId]
        );

        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        const name = rows[0].name;
        res.status(200).json({ name });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch user name' });
    }
});

// Get just the chip amount
app.get('/user/:id/chips', async (req, res) => {
    const playerId = req.params.id;

    try {
        const { rows } = await pgPool.query(
            "SELECT chips FROM player_stats WHERE id = $1",
            [playerId]
        );

        if (!rows.length) {
            return res.status(404).json({ message: 'Player stats not found' });
        }

        const chipAmt = rows[0].chips;
        res.status(200).json({ chipAmt });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch chip amount' });
    }
});


app.post('/api/create-game', async (req, res) => {
    const { gameId, tableName, password, buyIn } = req.body;

    try {
        // Get Redis memory usage
        const info = await redis.info('memory');
        const usedMemoryLine = info.split('\n').find(line => line.startsWith('used_memory:'));
        const usedMemoryBytes = parseInt(usedMemoryLine.split(':')[1]);
        const usedMemoryMB = usedMemoryBytes / (1024 * 1024);

        const maxAllowedMB = parseInt(process.env.REDIS_MAX_MB || '30'); // fallback to 30MB if not set

        console.log(`[Redis] Current usage: ${usedMemoryMB.toFixed(2)}MB / Limit: ${maxAllowedMB}MB`);

        if (usedMemoryMB >= maxAllowedMB) {
            console.warn(`[Redis] BLOCKED: Tried to create ${gameId} but memory limit exceeded.`);
            return res.status(400).json({ message: "Server is too full right now. Please try again later." });
        }

        // Actually create the game
        console.log(`[Game] Creating new game: ID=${gameId}, TableName="${tableName}", BuyIn=${buyIn}, PasswordProtected=${!!password}`);
        const newGame = await gameController.createGame(gameId, tableName, password, buyIn);

        console.log(`[Game] Successfully created game ${gameId}`);
        res.status(201).json({ gameId: newGame.gameId });

    } catch (error) {
        console.error('[Game] Create Game Error:', error);
        res.status(500).json({ message: 'Failed to create game' });
    }
});

app.get('/api/games', async (req, res) => {
    try {
        const keys = await redis.keys('game:*');

        const games = [];
        for (const key of keys) {
            const gameData = JSON.parse(await redis.get(key));
            if (gameData && gameData.meta) {
                let date = new Date(gameData.meta.createdAt);
                games.push({
                    gameId: gameData.gameId,
                    players: gameData.players.length,
                    maxPlayers: gameData.meta.maxPlayers,
                    status: gameData.meta.status,
                    createdAt: date.toLocaleString(),
                    tableName: gameData.meta.tableName || "Unnamed Table",
                    buyIn: gameData.meta.buyIn || 0,
                    passwordProtected: !!gameData.meta.password
                });
            }
        }

        res.json(games);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ message: 'Failed to fetch games' });
    }
});


const path = require('path');
// Serve frontend static files in production

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, 'build'))); // serve static files

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html')); // serve index.html for any unknown route
    });
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

