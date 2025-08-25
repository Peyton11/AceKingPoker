const { compareScores } = require('../utils/pokerUtils.js');
let expect;

before(async () => {
    const chai = await import('chai');
    expect = chai.expect;
});

describe('compareScores', () => {
    // Test Case 1: Different hand rankings
    it('should return 1 when score1 has a higher ranking', () => {
        const score1 = [10]; // Royal Flush
        const score2 = [9, 9]; // Straight Flush with high card 9
        expect(compareScores(score1, score2)).to.equal(1);
        expect(compareScores(score2, score1)).to.equal(-1);
    });

    // Test Case 2: Same hand ranking, different high cards
    it('should return 1 when score1 has the same ranking but higher high card', () => {
        const score1 = [5, 10]; // Straight with high card 10
        const score2 = [5, 9]; // Straight with high card 9
        expect(compareScores(score1, score2)).to.equal(1);
        expect(compareScores(score2, score1)).to.equal(-1);
    });

    // Test Case 3: Same hand ranking and high cards, different kickers
    it('should return 1 when score1 has the same ranking and high cards but higher kickers', () => {
        const score1 = [2, 14, 13, 12, 11]; // One Pair of Aces with kickers K, Q, J
        const score2 = [2, 14, 13, 12, 10]; // One Pair of Aces with kickers K, Q, 10
        expect(compareScores(score1, score2)).to.equal(1);
        expect(compareScores(score2, score1)).to.equal(-1);
    });

    // Test Case 4: Equal hands
    it('should return 0 when scores are equal', () => {
        const score1 = [3, 14, 13, 12]; // Two Pair, Aces and Kings with Queen kicker
        const score2 = [3, 14, 13, 12]; // Same as score1
        expect(compareScores(score1, score2)).to.equal(0);
    });

    // Test Case 5: Different rankings with additional elements
    it('should return -1 when score1 has a lower ranking despite being shorter', () => {
        const score1 = [5, 10]; // Straight with high card 10
        const score2 = [6, 14, 13, 12, 11, 10]; // Flush with A, K, Q, J, 10
        expect(compareScores(score1, score2)).to.equal(-1);
        expect(compareScores(score2, score1)).to.equal(1);
    });

    // Test Case 6: Same ranking, different lengths
    it('should return 1 when score1 is longer and all preceding elements are equal', () => {
        const score1 = [1, 14, 13, 12, 11, 10]; // High Card with A, K, Q, J, 10 (extra card)
        const score2 = [1, 14, 13, 12, 11]; // High Card with A, K, Q, J
        expect(compareScores(score1, score2)).to.equal(1);
        expect(compareScores(score2, score1)).to.equal(-1);
    });
});