// test/determineWinner.test.js
const { getBestHand, compareScores } = require('../utils/pokerUtils.js');
let expect;

before(async () => {
    const chai = await import('chai');
    expect = chai.expect;
});

describe('Determine Winner with Players', () => {

    // Helper function to evaluate all players' hands and determine the winner
    const findWinner = (players, communityCards) => {
        const playerHands = players.map(player => {
            const bestHand = getBestHand(player.pocketCards, communityCards);
            return { id: player.id, ...bestHand };
        });

        let winner = playerHands[0];
        for (let i = 1; i < playerHands.length; i++) {
            const comparison = compareScores(playerHands[i].score, winner.score);
            if (comparison > 0) {
                winner = playerHands[i];
            }
        }
        return winner;
    };

    it('should identify player1 with a Royal Flush as the winner', () => {

        const communityCards = [
            { rank: '10', suit: 'hearts' },
            { rank: 'J', suit: 'hearts' },
            { rank: 'Q', suit: 'hearts' },
            { rank: 'K', suit: 'hearts' },
            { rank: '9', suit: 'diamonds' }
        ];

        // Four players with unique pocket cards
        const players = [
            {
                id: 'player1',
                pocketCards: [
                    { rank: 'A', suit: 'hearts' },
                    { rank: '2', suit: 'spades' }
                ]
            },
            {
                id: 'player2',
                pocketCards: [
                    { rank: 'K', suit: 'diamonds' },
                    { rank: 'K', suit: 'clubs' }
                ]
            },
            {
                id: 'player3',
                pocketCards: [
                    { rank: 'Q', suit: 'diamonds' },
                    { rank: 'Q', suit: 'clubs' }
                ]
            },
            {
                id: 'player4',
                pocketCards: [
                    { rank: '9', suit: 'hearts' },
                    { rank: '9', suit: 'clubs' }
                ]
            }
        ];
        const winner = findWinner(players, communityCards);

        expect(winner.id).to.equal('player1');
        expect(winner.ranking).to.equal('Royal Flush');
        expect(winner.cards).to.deep.include.members([
            { rank: 'A', suit: 'hearts' },
            { rank: 'K', suit: 'hearts' },
            { rank: 'Q', suit: 'hearts' },
            { rank: 'J', suit: 'hearts' },
            { rank: '10', suit: 'hearts' }
        ]);
    });


    it('should correctly evaluate all players’ best hands', () => {
        // Shared community cards for all test cases
        const communityCards = [
            { rank: '10', suit: 'hearts' },
            { rank: 'J', suit: 'hearts' },
            { rank: 'Q', suit: 'hearts' },
            { rank: 'K', suit: 'hearts' },
            { rank: '9', suit: 'diamonds' }
        ];

        // Four players with unique pocket cards
        const players = [
            {
                id: 'player1',
                pocketCards: [
                    { rank: 'A', suit: 'hearts' },
                    { rank: '2', suit: 'spades' }
                ]
            },
            {
                id: 'player2',
                pocketCards: [
                    { rank: 'K', suit: 'diamonds' },
                    { rank: 'K', suit: 'clubs' }
                ]
            },
            {
                id: 'player3',
                pocketCards: [
                    { rank: 'Q', suit: 'diamonds' },
                    { rank: 'Q', suit: 'clubs' }
                ]
            },
            {
                id: 'player4',
                pocketCards: [
                    { rank: '9', suit: 'hearts' },
                    { rank: '9', suit: 'clubs' }
                ]
            }
        ];
        const playerHands = players.map(player => {
            const bestHand = getBestHand(player.pocketCards, communityCards);
            return { id: player.id, ...bestHand };
        });

        expect(playerHands).to.have.lengthOf(4);

        // Player 1: Royal Flush
        expect(playerHands[0].id).to.equal('player1');
        expect(playerHands[0].ranking).to.equal('Royal Flush');

        // Player 2: Straight
        expect(playerHands[1].id).to.equal('player2');
        expect(playerHands[1].ranking).to.equal('Straight');

        // Player 3: Straight
        expect(playerHands[2].id).to.equal('player3');
        expect(playerHands[2].ranking).to.equal('Straight');

        // Player 4: Straight Flush
        expect(playerHands[3].id).to.equal('player4');
        expect(playerHands[3].ranking).to.equal('Straight Flush');
    });


    it('should handle a different set of pocket cards correctly', () => {

        const communityCards = [
            { rank: '10', suit: 'hearts' },
            { rank: 'J', suit: 'hearts' },
            { rank: 'Q', suit: 'hearts' },
            { rank: 'K', suit: 'hearts' },
            { rank: '9', suit: 'diamonds' }
        ];

        const altPlayers = [
            {
                id: 'player1',
                pocketCards: [
                    { rank: '8', suit: 'hearts' },
                    { rank: '7', suit: 'spades' }
                ]
            },
            {
                id: 'player2',
                pocketCards: [
                    { rank: 'A', suit: 'clubs' },
                    { rank: 'K', suit: 'clubs' }
                ]
            },
            {
                id: 'player3',
                pocketCards: [
                    { rank: 'J', suit: 'diamonds' },
                    { rank: '10', suit: 'clubs' }
                ]
            },
            {
                id: 'player4',
                pocketCards: [
                    { rank: '5', suit: 'hearts' },
                    { rank: '4', suit: 'clubs' }
                ]
            }
        ];

        const winner = findWinner(altPlayers, communityCards);

        expect(winner.id).to.equal('player1');
        expect(winner.ranking).to.equal('Flush');
    });


    it('should handle a scenario where no strong hands are formed', () => {
        const communityCardsNoPairs = [
            { rank: '2', suit: 'hearts' },
            { rank: '5', suit: 'spades' },
            { rank: '8', suit: 'diamonds' },
            { rank: 'J', suit: 'clubs' },
            { rank: 'K', suit: 'hearts' }
        ];

        const highCardPlayers = [
            {
                id: 'player1',
                pocketCards: [
                    { rank: 'A', suit: 'spades' },
                    { rank: '10', suit: 'diamonds' }
                ]
            },
            {
                id: 'player2',
                pocketCards: [
                    { rank: 'Q', suit: 'clubs' },
                    { rank: '9', suit: 'hearts' }
                ]
            },
            {
                id: 'player3',
                pocketCards: [
                    { rank: '3', suit: 'diamonds' },
                    { rank: '7', suit: 'spades' }
                ]
            },
            {
                id: 'player4',
                pocketCards: [
                    { rank: '10', suit: 'clubs' },
                    { rank: '6', suit: 'hearts' }
                ]
            }
        ];

        const winner = findWinner(highCardPlayers, communityCardsNoPairs);

        expect(winner.id).to.equal('player1');
        expect(winner.ranking).to.equal('High Card');
    });

    it('should break ties in three-of-a-kind by evaluating kickers correctly', () => {
        const communityCards = [
            { rank: '9', suit: 'hearts' },
            { rank: '9', suit: 'diamonds' },
            { rank: '9', suit: 'clubs' },
            { rank: '6', suit: 'spades' },
            { rank: '2', suit: 'hearts' }
        ];

        const players = [
            {
                id: 'player1',
                pocketCards: [
                    { rank: 'A', suit: 'clubs' },
                    { rank: '4', suit: 'diamonds' }
                ]
            },
            {
                id: 'player2',
                pocketCards: [
                    { rank: 'K', suit: 'clubs' },
                    { rank: 'Q', suit: 'diamonds' }
                ]
            }
        ];

        const winner = findWinner(players, communityCards);

        // Expect player1 to win because its highest kicker (Ace) beats player2's highest kicker (King)
        expect(winner.id).to.equal('player1');
        expect(winner.ranking).to.equal('Three of a Kind');
    });

});



