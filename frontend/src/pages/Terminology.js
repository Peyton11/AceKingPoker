import React from 'react';
import NavigationBar from '../components/Navbar';

const Terminology = () => {

    const handRankings = [
        { term: "Royal Flush", definition: "A, K, Q, J, 10 of the same suit." },
        { term: "Straight Flush", definition: "Five consecutive cards of the same suit." },
        { term: "Four of a Kind", definition: "Four cards of the same rank." },
        { term: "Full House", definition: "Three of a kind and a pair." },
        { term: "Flush", definition: "Five cards of the same suit, not in sequence." },
        { term: "Straight", definition: "Five consecutive cards of different suits." },
        { term: "Three of a Kind", definition: "Three cards of the same rank." },
        { term: "Two Pair", definition: "Two pairs of different ranks." },
        { term: "One Pair", definition: "Two cards of the same rank." },
        { term: "High Card", definition: "The highest card in your hand when no other hand is made." },
    ];

    const tablePositions = [
        { position: "UTG", description: "Under the Gun - the first player to act pre-flop." },
        { position: "MP", description: "Middle Position - players in the middle of the betting order." },
        { position: "CO", description: "Cutoff - the player to the right of the dealer button." },
        { position: "BTN", description: "Button - the dealer position." },
        { position: "SB", description: "Small Blind - the player to the left of the dealer button." },
        { position: "BB", description: "Big Blind - the player to the left of the small blind." },
    ];

    const pokerTerms = [
        { term: "Active Player", definition: "A player who is currently in the hand and has chips in the pot." },
        { term: "Hero", definition: "The player you are analyzing or discussing." },
        { term: "Villain", definition: "The opponent you are analyzing or discussing." },
        { term: "Pre-flop", definition: "The betting round before the community cards are dealt." },
        { term: "Post-flop", definition: "The betting rounds after the community cards are dealt." },
        { term: "In Position", definition: "A player who acts after their opponents in a betting round." },
        { term: "Out of Position", definition: "A player who acts before their opponents in a betting round." },
        { term: "Relative Position", definition: "A player's position in relation to the dealer button." },
        { term: "First in", definition: "The first player to act in a betting round." },
        { term: "Stack Size", definition: "The amount of chips a player has in front of them." },
        { term: "Effective Stack", definition: "The smallest stack size among players involved in a hand." },
        { term: "Bet Sizing", definition: "The amount of chips a player bets." },
        { term: "The nut", definition: "The best possible hand a player can make with the current community cards." },
        { term: "Effective nuts", definition: "The best possible hand a player can make considering their opponent's range." },
        { term: "Speculative hand", definition: "A hand that has potential but is not strong yet." },
        { term: "Air", definition: "A hand that has no chance of winning at showdown." },
        { term: "Bluff catcher", definition: "A player who calls a bet with a weak hand to catch a bluff." },
        { term: "Pure bluff", definition: "A bet made with no chance of winning at showdown." },
        { term: "Semi-bluff", definition: "A bet made with a hand that has potential to improve." },
        { term: "Showdown Value", definition: "A hand that is likely to win at showdown." },
        { term: "Nut advatage", definition: "The player with the best possible hand given the community cards." },
        { term: "Passive player", definition: "A player who tends to call rather than bet or raise." },
        { term: "Aggressive player", definition: "A player who tends to bet and raise rather than call." },
        { term: "Regular", definition: "A player who plays frequently and is familiar with the game." },
        { term: "Pocket pair", definition: "Two cards of the same rank in a player's hand." },
        { term: "Draw", definition: "A hand that needs one or more cards to improve." },
        { term: "Gutshot straight draw", definition: "A draw that needs one card to complete a straight." },
        { term: "Open-ended straight draw", definition: "A draw that can complete a straight with two different cards." },
        { term: "Broadway", definition: "A hand that can make a straight with high cards." },
        { term: "Any two cards", definition: "A hand that can be any two cards." },
        { term: "Coin flip / race", definition: "A situation where two players have similar chances of winning." },
        { term: "Cooler", definition: "A situation where one player has a strong hand and another player has an even stronger hand." },
        { term: "Versus", definition: "A term used to describe a situation where one player is against another player." },
        { term: "Toy game", definition: "A simplified game used to model specific model aspects of a real game." },
        { term: "Game abstraction", definition: "The process of simplifying a game to make it easier to analyze." },
        { term: "Information abstraction", definition: "The process of simplifying the information available to players." },
        { term: "Action abstraction", definition: "The process of simplifying the actions available to players." },
        { term: "Rake", definition: "A fee taken by the house from each pot." },
        { term: "Calling station", definition: "A player who calls too often and rarely raises." },
    ];

    const playerActions = [
        { term: "Call", definition: "To match a bet made by another player." },
        { term: "Limp", definition: "To call the big blind instead of raising." },
        { term: "Raise", definition: "To increase the size of the current bet." },
        { term: "Check", definition: "To pass the action to the next player without betting." },
        { term: "Voluntary Put Money In Pot (VPIP)", definition: "The percentage of hands a player voluntarily puts money into the pot." },
        { term: "Raised First In (RFI)", definition: "The percentage of hands a player raises first in." },
        { term: "Two-bet (2-bet or 2b)", definition: "The first raise in a betting round." },
        { term: "Steal", definition: "Raise First In from BN, CO, or SB." },
        { term: "Isolate", definition: "To raise in order to force other players to fold." },
        { term: "Minraise", definition: "To raise the minimum amount allowed." },
        { term: "Minbet", definition: "To bet the minimum amount allowed." },
        { term: "Overbet", definition: "To bet more than the size of the pot." },
        { term: "Three-bet (3-bet or 3b)", definition: "The second bet in a betting round." },
        { term: "Resteal", definition: "To three-bet after an opponent steals." },
        { term: "All-in", definition: "To bet all of your remaining chips." },
        { term: "Open shove", definition: "To go all-in when no one else has entered the pot before you." },
        { term: "3-bet shove", definition: "To go all-in after an opponent has raised." },
        { term: "Four-bet (4-bet or 4b)", definition: "The third bet in a betting round." },
        { term: "Cold 4-bet", definition: "To four-bet after an opponent has raised and another player has called." },
        { term: "Cold call", definition: "To call a bet after another player has raised." },
        { term: "Squeeze", definition: "To three-bet after an opponent has raised and another player has called." },
        { term: "Continuation bet (c-bet)", definition: "A bet made by the player who raised pre-flop on the flop." },
        { term: "Donk bet", definition: "A bet made by a player who did not raise pre-flop." },
        { term: "Slow play", definition: "To play a strong hand passively in order to induce action." },
    ];

    return (
        <div className="bg-light min-vh-100">
            {/* Reuse Navbar */}
            <NavigationBar />

            <div className="container d-flex flex-column justify-content-center align-items-center mt-5">
                <h1 className="display-4 fw-bold text-primary mb-4">Poker Terminology</h1>
                <h2 className="text-secondary mb-3">Hand Rankings</h2>
                <ul>
                    {handRankings.map((item, index) => (
                        <li key={index}>
                            <strong>{item.term}:</strong> {item.definition}
                        </li>
                    ))}
                </ul>
                <h2 className="text-secondary mb-3">Table Positions</h2>
                <ul>
                    {tablePositions.map((item, index) => (
                        <li key={index}>
                            <strong>{item.position}:</strong> {item.description}
                        </li>
                    ))}
                </ul>
                <h2 className="text-secondary mb-3">Poker Terms</h2>
                <ul>
                    {pokerTerms.map((item, index) => (
                        <li key={index}>
                            <strong>{item.term}:</strong> {item.definition}
                        </li>
                    ))}
                </ul>
                <h2 className="text-secondary mb-3">Player Actions</h2>
                <ul>
                    {playerActions.map((item, index) => (
                        <li key={index}>
                            <strong>{item.term}:</strong> {item.definition}
                        </li>
                    ))}
                </ul>

                <p className="mt-4 text-muted">Source: Acevedo, Michael. <em>Modern Poker Theory</em>. D&B Publishing, 2019.</p>
            </div>
        </div>
    );
};

export default Terminology;
