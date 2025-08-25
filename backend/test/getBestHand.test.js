const { getBestHand } = require('../utils/pokerUtils.js'); // Adjust the path to your function
let expect;

before(async () => {
    const chai = await import('chai');
    expect = chai.expect;
});

describe('getBestHand', () => {
    // Test for Royal Flush
    // Value: This test ensures the function identifies a Royal Flush, the highest-ranking hand in poker (A-K-Q-J-10 of the same suit).
    // It’s critical because it validates that the function handles the best-case scenario correctly, including suit matching and rank sequence.
    it('should return Royal Flush for a perfect hand', () => {
        const pocketCards = [
            { rank: 'A', suit: 'hearts' },
            { rank: 'K', suit: 'hearts' }
        ];
        const communityCards = [
            { rank: 'Q', suit: 'hearts' },
            { rank: 'J', suit: 'hearts' },
            { rank: '10', suit: 'hearts' },
            { rank: '9', suit: 'diamonds' },
            { rank: '8', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Royal Flush');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['A', 'K', 'Q', 'J', '10']);
    });

    // Test for Straight Flush
    // Value: This verifies that the function detects a Straight Flush (five sequential cards of the same suit), a rare and strong hand.
    // It ensures proper handling of sequences and suit consistency, which are key to poker hand evaluation.
    it('should return Straight Flush for a sequential suited hand', () => {
        const pocketCards = [
            { rank: '9', suit: 'hearts' },
            { rank: '8', suit: 'hearts' }
        ];
        const communityCards = [
            { rank: '7', suit: 'hearts' },
            { rank: '6', suit: 'hearts' },
            { rank: '5', suit: 'hearts' },
            { rank: '4', suit: 'diamonds' },
            { rank: '3', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Straight Flush');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['9', '8', '7', '6', '5']);
    });

    // Test for Four of a Kind
    // Value: This checks if the function identifies Four of a Kind (four cards of the same rank) and selects the highest kicker.
    // It’s important for confirming rank grouping and kicker selection, which are vital in poker tiebreakers.
    it('should return Four of a Kind for four matching ranks', () => {
        const pocketCards = [
            { rank: 'A', suit: 'hearts' },
            { rank: 'A', suit: 'diamonds' }
        ];
        const communityCards = [
            { rank: 'A', suit: 'spades' },
            { rank: 'A', suit: 'clubs' },
            { rank: 'K', suit: 'hearts' },
            { rank: 'Q', suit: 'diamonds' },
            { rank: 'J', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Four of a Kind');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['A', 'A', 'A', 'A', 'K']);
    });

    // Test for Full House
    // Value: This ensures the function detects a Full House (three cards of one rank, two of another) and picks the best combination.
    // It’s valuable for testing the ability to identify and prioritize multi-rank groupings.
    it('should return Full House for three of a kind and a pair', () => {
        const pocketCards = [
            { rank: '10', suit: 'hearts' },
            { rank: '10', suit: 'diamonds' }
        ];
        const communityCards = [
            { rank: '10', suit: 'spades' },
            { rank: 'J', suit: 'clubs' },
            { rank: 'J', suit: 'hearts' },
            { rank: 'Q', suit: 'diamonds' },
            { rank: 'K', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Full House');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['J', 'J', '10', '10', '10']);
    });

    // Test for Flush
    // Value: This verifies that the function recognizes a Flush (five cards of the same suit) and selects the highest cards.
    // It’s essential for testing suit-based hand evaluation and card selection logic.
    it('should return Flush for five cards of the same suit', () => {
        const pocketCards = [
            { rank: 'A', suit: 'spades' },
            { rank: 'K', suit: 'spades' }
        ];
        const communityCards = [
            { rank: 'Q', suit: 'spades' },
            { rank: '10', suit: 'spades' },
            { rank: '5', suit: 'spades' },
            { rank: '4', suit: 'hearts' },
            { rank: '3', suit: 'diamonds' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Flush');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['A', 'K', 'Q', '10', '5']);
    });

    // Test for Low Straight (A-2-3-4-5)
    // Value: This checks if the function handles a Straight with Ace as a low card (A-2-3-4-5), an edge case in poker.
    // It’s crucial for validating flexible rank interpretation in straights.
    it('should return Straight for A-2-3-4-5', () => {
        const pocketCards = [
            { rank: 'A', suit: 'hearts' },
            { rank: '2', suit: 'diamonds' }
        ];
        const communityCards = [
            { rank: '3', suit: 'spades' },
            { rank: '4', suit: 'clubs' },
            { rank: '5', suit: 'hearts' },
            { rank: '8', suit: 'diamonds' },
            { rank: '7', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Straight');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['A', '5', '4', '3', '2' ]);
    });

    // Test for Three of a Kind
    // Value: This ensures the function identifies Three of a Kind and picks the two highest kickers.
    // It’s important for testing rank grouping and kicker selection accuracy.
    it('should return Three of a Kind with the highest kickers', () => {
        const pocketCards = [
            { rank: 'J', suit: 'hearts' },
            { rank: 'J', suit: 'diamonds' }
        ];
        const communityCards = [
            { rank: 'J', suit: 'spades' },
            { rank: '10', suit: 'clubs' },
            { rank: '9', suit: 'hearts' },
            { rank: '4', suit: 'diamonds' },
            { rank: '7', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Three of a Kind');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['J', 'J', 'J', '10', '9']);
    });

    // Test for Two Pair
    // Value: This verifies that the function detects Two Pair and selects the highest pairs and kicker.
    // It’s valuable for ensuring proper pair identification and prioritization.
    it('should return Two Pair with the highest pairs and kicker', () => {
        const pocketCards = [
            { rank: 'Q', suit: 'hearts' },
            { rank: 'Q', suit: 'diamonds' }
        ];
        const communityCards = [
            { rank: 'K', suit: 'spades' },
            { rank: 'K', suit: 'clubs' },
            { rank: 'A', suit: 'hearts' },
            { rank: '10', suit: 'diamonds' },
            { rank: '9', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Two Pair');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['A', 'K', 'K', 'Q', 'Q']);
    });

    // Test for One Pair
    // Value: This checks if the function identifies One Pair and selects the three highest kickers.
    // It’s key for testing basic rank matching and kicker logic in weaker hands.
    it('should return One Pair with the highest kickers', () => {
        const pocketCards = [
            { rank: '5', suit: 'hearts' },
            { rank: '5', suit: 'diamonds' }
        ];
        const communityCards = [
            { rank: 'A', suit: 'spades' },
            { rank: 'K', suit: 'clubs' },
            { rank: 'Q', suit: 'hearts' },
            { rank: '9', suit: 'diamonds' },
            { rank: '10', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('One Pair');
        expect(result.cards.map(c => c.rank)).to.deep.equal([ 'A', 'K', 'Q', '5', '5' ]);
    });

    // Test for High Card
    // Value: This ensures the function defaults to High Card when no other hand is possible, selecting the five highest cards.
    // It’s critical for validating the fallback behavior in the absence of stronger hands.
    it('should return High Card for no matching ranks or suits', () => {
        const pocketCards = [
            { rank: 'A', suit: 'hearts' },
            { rank: '2', suit: 'diamonds' }
        ];
        const communityCards = [
            { rank: '4', suit: 'spades' },
            { rank: '6', suit: 'clubs' },
            { rank: '8', suit: 'hearts' },
            { rank: '10', suit: 'diamonds' },
            { rank: 'Q', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('High Card');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['A', 'Q', '10', '8', '6']);
    });

    // Test for Highest Straight Selection
    // Value: This verifies that the function picks the highest possible Straight when multiple options exist.
    // It’s important for ensuring the function optimizes for the strongest hand in ambiguous cases.
    it('should select the highest straight when multiple are possible', () => {
        const pocketCards = [
            { rank: '10', suit: 'hearts' },
            { rank: '9', suit: 'diamonds' }
        ];
        const communityCards = [
            { rank: '8', suit: 'spades' },
            { rank: '7', suit: 'clubs' },
            { rank: '6', suit: 'hearts' },
            { rank: '5', suit: 'diamonds' },
            { rank: '4', suit: 'spades' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Straight');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['10', '9', '8', '7', '6']);
    });

    // Test for Straight Flush Priority
    // Value: This ensures the function prioritizes a Straight Flush over a regular Flush when both are possible.
    // It’s vital for confirming correct hand ranking hierarchy in complex scenarios.
    it('should return Straight Flush over a regular Flush', () => {
        const pocketCards = [
            { rank: 'K', suit: 'hearts' },
            { rank: 'Q', suit: 'hearts' }
        ];
        const communityCards = [
            { rank: 'J', suit: 'hearts' },
            { rank: '10', suit: 'hearts' },
            { rank: '9', suit: 'hearts' },
            { rank: '8', suit: 'hearts' },
            { rank: '7', suit: 'diamonds' }
        ];
        const result = getBestHand(pocketCards, communityCards);
        expect(result.ranking).to.equal('Straight Flush');
        expect(result.cards.map(c => c.rank)).to.deep.equal(['K', 'Q', 'J', '10', '9']);
    });
});