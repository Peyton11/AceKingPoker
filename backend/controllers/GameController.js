const Deck = require("../models/Deck");
const { getBestHand, compareScores } = require('../utils/pokerUtils');


class GameController {
    constructor(io, redis) {
        this.io = io;
        this.redis = redis;
    }

    async createGame(gameId = null, tableName = "Unnamed Table", password = null, buyIn = 0) {
        const deck = new Deck();
        deck.shuffle();

        const newGame = {
            gameId,
            players: [],
            queuedPlayers: [],
            deck: deck.cards,
            communityCards: [],
            pot: 0,
            currentTurn: null,
            dealerPosition: 0,
            smallBlind: 10,
            bigBlind: 20,
            round: "waiting",
            activePlayers: [],
            lastBet: 0,
            meta: {
                createdAt: Date.now(),
                status: "waiting",
                maxPlayers: 8,
                tableName: tableName || "Unnamed Table",
                password: password || null,
                buyIn: buyIn || 0
            }
        };

        try {
            await this.redis.set(`game:${gameId}`, JSON.stringify(newGame));
            console.log(`Game created: ${gameId}`);
            return newGame;
        } catch (error) {
            console.error("Error creating game:", error);
            throw new Error("Failed to create game");
        }
    }

    async startGame(gameId) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));

        if (game.players.map(p => p.id).length < 2) {
            throw new Error("At least 2 players are required to start the game");
        }

        const deck = new Deck();
        deck.shuffle();

        const gameState = {
            gameId,
            players: game.players.filter(p => !p.leftGame).map(p => ({ ...p, actedThisRound: false })),
            queuedPlayers: game.queuedPlayers || [],
            deck: deck.cards,
            communityCards: [],
            pot: 0,
            currentTurn: null,
            dealerPosition: 0,
            smallBlind: 5,
            bigBlind: 10,
            round: 'preflop',
            activePlayers: game.players.map(p => p.id),
            lastBet: 0,
            meta: {
                ...game.meta,
                status: "playing"
            }
        };

        await this.redis.set(`game:${gameId}`, JSON.stringify(gameState));
        console.log(`Game state saved for : ${gameId}`);
        await this.dealPocketCards(gameId);
        console.log(`Game dealt pocket cards for : ${gameId}`);
        await this.setInitialBlinds(gameId);
        console.log(`Game dealt blinds for : ${gameId}`);
        await this.nextTurn(gameId);
    }

    async dealPocketCards(gameId) {
        console.log(`Dealing Pocket Cards: ${gameId}`);
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));

        const deckCards = game.deck;

        for (const player of game.players) {
            player.cards = deckCards.splice(0, 2);
            await this.redis.set(`game:${gameId}:player:${player.id}`, JSON.stringify(player.cards));
        }

        game.deck = deckCards;
        await this.redis.set(`game:${gameId}`, JSON.stringify(game));
        await this.updateAllPlayers(gameId);
    }

    async setInitialBlinds(gameId) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));
        for (const player of game.players) {
            player.betThisRound = 0;
            player.folded = false;
        }

        let smallBlindIndex = game.dealerPosition;
        let bigBlindIndex = (game.dealerPosition + 1) % game.players.length;

        game.players[smallBlindIndex].betThisRound = game.smallBlind;
        game.players[smallBlindIndex].chips -= game.smallBlind;
        game.players[bigBlindIndex].betThisRound = game.bigBlind;
        game.players[bigBlindIndex].chips -= game.bigBlind;
        game.pot = game.smallBlind + game.bigBlind;
        game.lastBet = game.bigBlind; // Set initial bet level to big blind



        await this.redis.set(`game:${gameId}`, JSON.stringify(game));
    }

    async handleShowdown(gameId) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));
        let bestHandEval = null;
        let winner = null;

        for (const player of game.players) {
            if (!player.folded) {
                const playerHandEval = getBestHand(player.cards, game.communityCards);
                if (!bestHandEval || compareScores(playerHandEval.score, bestHandEval.score) > 0) {
                    bestHandEval = playerHandEval;
                    winner = player;
                }
            }
        }

        if (winner) {
            winner.chips += game.pot;
            if(!winner.isCPU) {
                winner.stats.handsWon++;
                winner.stats.totalChipsWon += game.pot;
            }
            await this.redis.set(`game:${gameId}`, JSON.stringify(game));
        }

        const winnerCards = getBestHand(winner.cards, game.communityCards);
        await this.endGame(gameId, winner, game.pot, winnerCards.cards, winnerCards.ranking);
    }

    async handleEarlyFold(gameId) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));
        const winner = game.players.find(p => !p.folded);

        if (winner) {
            winner.chips += game.pot;
            if(!winner.isCPU) {
                winner.stats.handsWon++;
                winner.stats.totalChipsWon += game.pot;
            }
            await this.redis.set(`game:${gameId}`, JSON.stringify(game));
        }
        await this.endGame(gameId, winner, game.pot);
    }


    async endGame(gameId, winner = null, prevPotSize = 0, winningCards = null, winningRank = null) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));
        // 1. Mark the game as ending to prevent future player actions
        game.meta.gameEnding = true;
        await this.redis.set(`game:${gameId}`, JSON.stringify(game));

        // 2. Notify all players about the previous hand result
        if (winner) {
            this.io.to(gameId).emit('handEnded', {
                winner: winner.id,
                chipsWon: prevPotSize,
                winningCards: winningCards,
                winningRank: winningRank
            });
        }

        // 3. Delay for players to see the winner
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 4. Batch delete all player keys
        for (const p of game.players) {
            await this.redis.del(`game:${gameId}:player:${p.id}`);
        }

        // 5. Remove players who left
        game.players = game.players.filter(p => !p.leftGame);

        // 6. Move queued players into game
        const queuedNowJoining = [...game.queuedPlayers];
        game.players.push(...queuedNowJoining);
        game.queuedPlayers = [];

        for (const queuedPlayerId of queuedNowJoining) {
            this.io.to(queuedPlayerId).emit('joinedFromQueue');
        }

        // 7. Reset game for next hand
        game.deck = [];
        game.communityCards = [];
        game.pot = 0;
        game.currentTurn = null;
        game.round = "waiting";
        game.activePlayers = [];
        game.lastBet = 0;
        game.players.forEach(p => {
            p.cards = [];
            p.folded = false;
            p.betThisRound = 0;
            p.actedThisRound = false;
            p.handPlayedThisRound = false;
        });
        game.meta.status = "waiting";

        // 8. Clear gameEnding flag
        delete game.meta.gameEnding;

        await this.redis.set(`game:${gameId}`, JSON.stringify(game));
        await this.updateAllPlayers(gameId);
    }


    async isRoundComplete(gameId) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));
        const activePlayers = game.players.filter(p => !p.folded);
        if (activePlayers.length <= 1) return true;
        // Check if all active players have acted
        if (!activePlayers.every(p => p.actedThisRound)) {
            return false;
        }
        const highestBet = Math.max(...activePlayers.map(p => p.betThisRound));
        return activePlayers.every(p => p.betThisRound === highestBet);
    }

    async nextTurn(gameId) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));


        if (game.meta?.gameEnding) {
            console.log(`Skipping nextTurn because game ${gameId} is ending.`);
            return;
        }
        if (!game.activePlayers.length) {
            game.activePlayers = game.players.filter(p => !p.folded).map(p => p.id);
        }

        if (game.activePlayers.length <= 1) {
            await this.handleEarlyFold(gameId);
            return;
        }

        if (await this.isRoundComplete(gameId)) {
            await this.advanceRound(gameId);
            return;
        }

        let startPosition;
        if (game.round === 'preflop') {
            const bigBlindIndex = game.players.length === 2 ? (game.dealerPosition + 1) % 2 : (game.dealerPosition + 2) % game.players.length;
            startPosition = (bigBlindIndex + 1) % game.players.length; // After big blind
        } else {
            startPosition = (game.dealerPosition + 1) % game.players.length; // After dealer
        }

        if (!game.currentTurn && game.currentTurn !== 0) {
            game.currentTurn = startPosition;
            while (game.players[game.currentTurn].folded) {
                game.currentTurn = (game.currentTurn + 1) % game.players.length;
            }
        } else {
            let nextIndex = (game.currentTurn + 1) % game.players.length;
            while (game.players[nextIndex].folded) {
                nextIndex = (nextIndex + 1) % game.players.length;
            }
            game.currentTurn = nextIndex;
        }

        await this.redis.set(`game:${gameId}`, JSON.stringify(game));
        await this.updateAllPlayers(gameId);

        // Check if the current player is a CPU and call makeCPUMove
        const currentPlayer = game.players[game.currentTurn];
        if (currentPlayer.isCPU) {
            // console.log(`CPU ${currentPlayer.id}'s turn`); // debugging
            const cpuMove = await this.makeCPUMove(currentPlayer, game);
            // console.log(`CPU ${currentPlayer.id} decided to ${cpuMove.action}`);
            await this.playerAction(gameId, currentPlayer.id, cpuMove.action, cpuMove.amount || 0);
        }
    }

    async playerAction(gameId, playerId, action, amount = 0) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));


        if (game.meta?.gameEnding) {
            console.log(`Ignoring player action because game ${gameId} is ending.`);
            return;
        }


        const playerIndex = game.players.findIndex(p => p.id === playerId);

        if (playerIndex === -1 || playerIndex !== game.currentTurn || game.players[playerIndex].folded) {
            this.io.to(playerId).emit('error', { message: 'Invalid action or not your turn' });
            return;
        }

        const player = game.players[playerIndex];

        if (game.round === 'preflop' && !player.handPlayedThisRound) {
            if(!player.isCPU){
                player.stats.handsPlayed++;
                player.handPlayedThisRound = true;
            }
        }

        switch (action) {
            case 'fold':
                player.folded = true;
                game.activePlayers = game.activePlayers.filter(id => id !== playerId);
                if(!player.isCPU) {
                    player.stats.folds++;
                }
                break;
            case 'call':
                const toCall = game.lastBet - player.betThisRound;
                if (player.chips < toCall) {
                    this.io.to(playerId).emit('error', { message: 'Not enough chips' });
                    return;
                }
                player.chips -= toCall;
                player.betThisRound += toCall;
                game.pot += toCall;
                break;
            case 'raise':
                const totalBet = game.lastBet + amount;
                const raiseAmount = totalBet - player.betThisRound;
                if (player.chips < raiseAmount) {
                    this.io.to(playerId).emit('error', { message: 'Not enough chips' });
                    return;
                }
                player.chips -= raiseAmount;
                player.betThisRound = totalBet;
                game.pot += raiseAmount;
                game.lastBet = totalBet;
                game.players.forEach(p => {
                    if (p.leftGame) return;

                    if (p.id !== playerId && !p.folded) {
                        p.actedThisRound = false;
                    }
                });
                break;
            default:
                this.io.to(playerId).emit('error', { message: 'Invalid action' });
                return;
        }
        player.actedThisRound = true; // Mark as acted
        // console.log("After player action", JSON.stringify(game));
        await this.redis.set(`game:${gameId}`, JSON.stringify(game));
        await this.nextTurn(gameId);
    }

    async makeCPUMove(cpuPlayer, game) {
        const { communityCards, pot, lastBet, round } = game;

        // Add a 1-second delay before the CPU makes its move
        await new Promise(resolve => setTimeout(resolve, 1000));

        const bestHand = getBestHand(cpuPlayer.cards, communityCards);
        const handRanking = bestHand.ranking;
        const handScore = bestHand.score;

        const toCall = lastBet - cpuPlayer.betThisRound;
        const potOdds = this.calculatePotOdds(pot, toCall);

        const strongHands = ["Three of a Kind", "Straight", "Flush", "Full House", "Four of a Kind", "Straight Flush", "Royal Flush"];
        const mediumHands = ["One Pair", "Two Pair"];

        // --- Preflop Logic ---
        if (round === "preflop") {
            const [card1, card2] = cpuPlayer.cards;

            // Check if the cards are suited
            const isSuited = card1.suit === card2.suit;

            // Check the rank values of the cards
            const highCardRanks = ["Ace", "King", "Queen", "Jack", "10"];
            console.log("Card1", card1.rank, "Card2", card2.rank);
            const isHighCard = highCardRanks.includes(card1.rank) || highCardRanks.includes(card2.rank);

            // Check if the cards are a pocket pair
            if (mediumHands.includes(handRanking)) {
                if (Math.random() < 0.6) {
                    // 60% chance to raise with pocket pair
                    console.log(`[CPU ${cpuPlayer.id}] raises preflop with ${card1.rank}${card1.suit} and ${card2.rank}${card2.suit}`);
                    const betAmount = Math.min(cpuPlayer.chips, Math.floor(Math.random() * 20) + 10);
                    return { action: "raise", amount: betAmount };
                } else {
                    console.log(`[CPU ${cpuPlayer.id}] calls preflop with ${card1.rank}${card1.suit} and ${card2.rank}${card2.suit}`);
                    return { action: "call" };
                }
            } else if (isHighCard || (isSuited && (Math.abs(card1.rank - card2.rank) <= 2))) {
                // Call if the cards are suited connectors (within 2) or if one of them is a high card
                if (cpuPlayer.chips >= toCall) {
                    if (Math.random() < 0.1) {
                        // 10% chance to raise with high cards
                        console.log(`[CPU ${cpuPlayer.id}] bluff raises preflop with ${card1.rank}${card1.suit} and ${card2.rank}${card2.suit}`);
                        const betAmount = Math.min(cpuPlayer.chips, Math.floor(Math.random() * 20) + 10);
                        return { action: "raise", amount: betAmount };
                    } else {
                        console.log(`[CPU ${cpuPlayer.id}] calls preflop with ${card1.rank}${card1.suit} and ${card2.rank}${card2.suit}`);
                        return { action: "call" };
                    }
                } else {
                    console.log(`[CPU ${cpuPlayer.id}] folds preflop due to insufficient chips`);
                    return { action: "fold" };
                }
            } else {
                if (toCall == 0) {
                    console.log(`[CPU ${cpuPlayer.id}] checks preflop with ${card1.rank}${card1.suit} and ${card2.rank}${card2.suit}`);
                    return { action: "call" };
                }
                console.log(`[CPU ${cpuPlayer.id}] folds preflop with ${card1.rank}${card1.suit} and ${card2.rank}${card2.suit}`);
                return { action: "fold" };
            }
        }

        // Log the CPU's hand and evaluation for debugging
        //console.log(`CPU ${cpuPlayer.id} cards:`, cpuPlayer.cards);
        //console.log(`Community cards:`, communityCards);
        //console.log(`Best hand: ${handRanking}, Score: ${handScore}`);
        //console.log(`[CPU ${cpuPlayer.id}] Hand: ${handRanking} (Score: ${handScore}), To call: ${toCall}, Pot odds: ${potOdds}`);
        
        // --- If no bet yet (toCall == 0), sometimes bet instead of checking ---
        if (toCall === 0) {
            if (strongHands.includes(handRanking)) {
                // Always bet strong hands
                const betAmount = Math.min(cpuPlayer.chips, Math.floor(Math.random() * 20) + 20);
                return { action: "raise", amount: betAmount };
            } else if (mediumHands.includes(handRanking) && Math.random() < 0.4) {
                // 40% chance to bet with medium hands
                const betAmount = Math.min(cpuPlayer.chips, Math.floor(Math.random() * 20) + 10);
                return { action: "raise", amount: betAmount };
            } else {
                // Otherwise just check
                return { action: "call" }; 
            }
        }
    
        // --- Strong hands call or raise ---
        if (strongHands.includes(handRanking)) {
            if (Math.random() < 0.55) {
                // 55% chance to reraise with strong hands
                const raiseAmount = Math.min(cpuPlayer.chips, toCall + Math.floor(Math.random() * 20) + 20);
                return { action: "raise", amount: raiseAmount };
            }
        }
    
        // --- Medium-strength hands ---
        if (mediumHands.includes(handRanking)) {
            if (cpuPlayer.chips >= toCall) {
                if (handRanking === "Two Pair" && Math.random() < 0.35) {
                    // 35% chance to reraise with Two Pair
                    const raiseAmount = Math.min(cpuPlayer.chips, toCall + Math.floor(Math.random() * 20) + 20);
                    return { action: "raise", amount: raiseAmount };
                } else if (Math.random() < 0.1) {
                    // 10% chance to reraise with One Pair
                    const raiseAmount = Math.min(cpuPlayer.chips, toCall + Math.floor(Math.random() * 20) + 10);
                    return { action: "raise", amount: raiseAmount };
                }
                return { action: "call" };
            } else {
                return { action: "fold" };
            }
        }

        // --- Weak hands (High Card) ---
        if (handRanking === "High Card") {
            if (potOdds > 0.5 || cpuPlayer.chips < toCall) {
                //console.log(`[CPU ${cpuPlayer.id}] folds weak hand`);
                return { action: "fold" };
            } else {
                //console.log(`[CPU ${cpuPlayer.id}] calls weak hand due to pot odds`);
                return { action: "call" };
            }
        }

        // --- Default fallback ---
        if (potOdds > 0.5 || cpuPlayer.chips < toCall) {
            //console.log(`[CPU ${cpuPlayer.id}] folds based on pot odds`);
            return { action: "fold" };
        } else {
            //console.log(`[CPU ${cpuPlayer.id}] calls based on pot odds`);
            return { action: "call" };
        }
    }

    calculatePotOdds(pot, callAmount) {
        if (callAmount === 0) return 0; // Avoid division by 0
        return pot / (pot + callAmount);
    }

    async advanceRound(gameId) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));
        const deckCards = game.deck;

        switch (game.round) {
            case 'preflop':
                game.communityCards = deckCards.splice(0, 3);
                game.round = 'flop';
                break;
            case 'flop':
                game.communityCards.push(deckCards.shift());
                game.round = 'turn';
                break;
            case 'turn':
                game.communityCards.push(deckCards.shift());
                game.round = 'river';
                break;
            case 'river':
                game.round = 'showdown';
                await this.redis.set(`game:${gameId}`, JSON.stringify(game));
                await this.handleShowdown(gameId);
                return;
        }

        game.lastBet = 0;
        game.players.forEach(p => {
            if (p.leftGame) return;
            p.betThisRound = 0;
            p.actedThisRound = false; // Reset actedThisRound for new round
        });
        game.deck = deckCards;
        await this.redis.set(`game:${gameId}`, JSON.stringify(game));
        await this.updateAllPlayers(gameId);
        await this.nextTurn(gameId);
    }

    async updateAllPlayers(gameId) {
        const game = JSON.parse(await this.redis.get(`game:${gameId}`));

        const connectedPlayers = game.players.filter(p => !p.leftGame).length;
        const queuedPlayers = game.queuedPlayers.length;
        const totalActivePlayers = connectedPlayers + queuedPlayers;

        game.meta.players = totalActivePlayers;

        for (const player of game.players) {
            const cards = JSON.parse(await this.redis.get(`game:${gameId}:player:${player.id}`)) || [];
            const playerState = {
                pot: game.pot,
                communityCards: game.communityCards,
                currentTurn: game.currentTurn,
                round: game.round,
                lastBet: game.lastBet,
                players: game.players.map(p => ({
                    id: p.id,
                    chips: p.chips,
                    betThisRound: p.betThisRound,
                    folded: p.folded
                })),
                yourCards: cards,
                yourChips: player.chips
            };
            this.io.to(player.id).emit('gameUpdate', playerState);
        }

        await this.redis.set(`game:${gameId}`, JSON.stringify(game)); // save updated meta too
    }
}

module.exports = { GameController };