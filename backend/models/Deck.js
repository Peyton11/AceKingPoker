// Deck.js
// Implementation of Deck class

const Card = require("./Card");

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    // Initialize the deck
    reset() {
        const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
        const ranks = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];

        // Create each card (52 total)
        this.cards = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    // Shuffle the deck
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    // Deal the cards
    deal(numCards) {
        return this.cards.splice(0, numCards);
    }
}

module.exports = Deck;
