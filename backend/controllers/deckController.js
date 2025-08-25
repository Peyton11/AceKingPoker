// deckController.js
// This acts as a controller in an MVC structure.
// It handles HTTP requests (e.g., shuffling, dealing).
// It interacts with Deck.js to perform actions but doesn’t manage deck state internally.
// This allows separation of concerns: API logic in the controller, and card/deck logic in models.

const Deck = require("../models/Deck");

const deck = new Deck();

const shuffleDeck = (req, res) => {
    deck.reset();
    deck.shuffle();
    res.json({message: "Deck shuffled successfully!"});
};

const dealCards = (req, res) => {
    const numCards = parseInt(req.query.numCards) || 5; // Default to 5 cards
    const cards = deck.deal(numCards);
    res.json(cards);
}

module.exports = {shuffleDeck, dealCards};
