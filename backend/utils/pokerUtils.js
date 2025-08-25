// Rank values for card comparison (A=14 high, but can be 1 in low straights)
const rankValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Mapping of numerical rankings to hand names
const rankingNames = {
    10: 'Royal Flush',
    9: 'Straight Flush',
    8: 'Four of a Kind',
    7: 'Full House',
    6: 'Flush',
    5: 'Straight',
    4: 'Three of a Kind',
    3: 'Two Pair',
    2: 'One Pair',
    1: 'High Card'
};

// Helper to get numerical rank value
function getRankValue(rank) {
    return rankValues[rank];
}

// Check if hand is a flush (all same suit)
function isFlush(hand) {
    const suits = hand.map(card => card.suit);
    return new Set(suits).size === 1;
}

// Check if hand is a straight, return high card value or null
function isStraight(hand) {
    const values = hand.map(card => getRankValue(card.rank)).sort((a, b) => a - b);
    if (values.join(',') === '2,3,4,5,14') {
        return 5; // A-2-3-4-5, high card is 5
    }
    if (values[4] - values[0] === 4 && new Set(values).size === 5) {
        return values[4]; // High card of the straight
    }
    return null;
}

// Get frequency of ranks in the hand
function getRankFrequencies(hand) {
    const freq = {};
    hand.forEach(card => {
        const rank = card.rank;
        freq[rank] = (freq[rank] || 0) + 1;
    });
    return freq;
}

// Evaluate a five-card hand and return its ranking, score, and cards
function evaluateHand(hand) {
    if (!Array.isArray(hand)) {
        console.log('Invalid hand detected:', hand);
        throw new Error(`Expected hand to be an array, got: ${typeof hand}`);
    }
    hand.sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
    const sortedValues = hand.map(card => getRankValue(card.rank));
    const isFlushHand = hand.length === 5 ? isFlush(hand) : false;
    const straightHigh = hand.length === 5 ? isStraight(hand) : false;
    const freq = getRankFrequencies(hand);
    const freqValues = Object.values(freq);
    const rankCounts = Object.entries(freq).sort((a, b) => b[1] - a[1] || getRankValue(b[0]) - getRankValue(a[0]));

    if (isFlushHand && straightHigh) {
        if (straightHigh === 14) {
            return { ranking: 10, score: [10], hand }; // Royal Flush
        } else {
            return { ranking: 9, score: [9, straightHigh], hand }; // Straight Flush
        }
    } else if (freqValues.includes(4)) {
        const fourRank = rankCounts.find(([rank, count]) => count === 4)[0];
        const kicker = rankCounts.find(([rank, count]) => count === 1)[0];
        return { ranking: 8, score: [8, getRankValue(fourRank), getRankValue(kicker)], hand };
    } else if (freqValues.includes(3) && freqValues.includes(2)) {
        const threeRank = rankCounts.find(([rank, count]) => count === 3)[0];
        const pairRank = rankCounts.find(([rank, count]) => count === 2)[0];
        return { ranking: 7, score: [7, getRankValue(threeRank), getRankValue(pairRank)], hand };
    } else if (isFlushHand) {
        return { ranking: 6, score: [6, ...sortedValues], hand };
    } else if (straightHigh) {
        return { ranking: 5, score: [5, straightHigh], hand };
    } else if (freqValues.includes(3)) {
        const threeRank = rankCounts.find(([rank, count]) => count === 3)[0];
        const kickers = rankCounts.filter(([rank, count]) => count === 1)
            .map(([rank]) => getRankValue(rank))
            .slice(0, 2);
        return { ranking: 4, score: [4, getRankValue(threeRank), ...kickers], hand };
    } else if (freqValues.filter(v => v === 2).length >= 2) {
        const pairs = rankCounts.filter(([rank, count]) => count === 2)
            .map(([rank]) => getRankValue(rank))
            .sort((a, b) => b - a);
        const kickerEntry = rankCounts.find(([rank, count]) => count === 1);
        const kicker = kickerEntry ? getRankValue(kickerEntry[0]) : null;
        return { ranking: 3, score: [3, ...pairs.slice(0, 2), kicker], hand };
    } else if (freqValues.includes(2)) {
        const pairRank = rankCounts.find(([rank, count]) => count === 2)[0];
        const kickers = rankCounts.filter(([rank, count]) => count === 1)
            .map(([rank]) => getRankValue(rank))
            .slice(0, 3);
        return { ranking: 2, score: [2, getRankValue(pairRank), ...kickers], hand };
    } else {
        return { ranking: 1, score: [1, ...sortedValues], hand };
    }
}

// Generate all combinations of k elements from array
function combinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const first = arr[0];
    const rest = arr.slice(1);
    const withFirst = combinations(rest, k - 1).map(combo => [first, ...combo]);
    const withoutFirst = combinations(rest, k);
    return [...withFirst, ...withoutFirst];
}

// Compare two score arrays for hand ranking
function compareScores(score1, score2) {
    for (let i = 0; i < Math.min(score1.length, score2.length); i++) {
        if (score1[i] > score2[i]) return 1;
        if (score1[i] < score2[i]) return -1;
    }
    return score1.length - score2.length;
}

function getBestHand(pocketCards, communityCards) {
    const allCards = [...pocketCards, ...communityCards];
    const numCards = Math.min(allCards.length, 5); // Use up to 5 cards
    const allHands = combinations(allCards, numCards); // Generate combinations of up to 5 cards
    let bestEval = null;
    let bestScore = [-Infinity];

    allHands.forEach((hand, index) => {
        // console.log(`Evaluating hand ${index}:`, hand);
        const evaluation = evaluateHand(hand);
        if (compareScores(evaluation.score, bestScore) > 0) {
            bestScore = evaluation.score;
            bestEval = evaluation;
        }
    });

    const rankingName = rankingNames[bestEval.ranking];
    return { ranking: rankingName, score: bestEval.score, cards: bestEval.hand };
}

// Export the functions for use in other files
module.exports = {
    getBestHand,
    compareScores,
};