class Card {
    constructor(suit, rank, isHack = false) {
        this.suit = suit;
        this.rank = rank;
        this.isHack = isHack;
        this.element = null;
    }

    createElement() {
        const card = document.createElement('div');
        card.className = 'card';
        if (this.isHack) card.classList.add('hack');
        if (this.suit === 'Hearts' || this.suit === 'Diamonds') card.classList.add('red');
        card.textContent = this.isHack ? `HACK ${this.suit[0]}` : `${this.rank}${this.suit[0]}`;
        card.dataset.suit = this.suit;
        card.dataset.rank = this.rank;
        card.dataset.hack = this.isHack;
        this.element = card;
        return card;
    }
}

class CyberpunkSolitaire {
    constructor() {
        this.suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        this.ranks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];
        this.tableau = [[], [], [], [], [], [], []];
        this.foundation = [[], [], [], []];
        this.stock = [];
        this.waste = [];
        this.energy = 100;
        this.hackUsed = false;
        this.initGame();
    }

    initGame() {
        // Create deck with hack cards
        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                this.deck.push(new Card(suit, rank));
            }
            this.deck.push(new Card(suit, 'H', true)); // Hack card per suit
        }
        this.deck.sort(() => Math.random() - 0.5);

        // Deal to tableau
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck.pop();
                const cardElement = card.createElement();
                this.tableau[j].push(card);
                const pile = document.getElementById(`tableau-${j + 1}`);
                pile.appendChild(cardElement);
                cardElement.style.top = `${(this.tableau[j].length - 1) * 30}px`;
            }
        }

        this.stock = this.deck;
        this.deck = [];
        this.renderStock();
        this.renderEnergy();
        this.addDragAndDrop();
    }

    renderStock() {
        const stockPile = document.getElementById('stock');
        stockPile.innerHTML = '';
        if (this.stock.length > 0) {
            const back = document.createElement('div');
            back.className = 'card';
            back.style.backgroundColor = '#555';
            back.textContent = 'STOCK';
            stockPile.appendChild(back);
            back.addEventListener('click', () => this.drawCard());
        }
    }

    renderEnergy() {
        document.getElementById('energy').textContent = `EP: ${this.energy}`;
        if (this.energy <= 0) alert('Out of Energy! Game Over.');
    }

    drawCard() {
        if (this.energy >= 2 && this.stock.length > 0) {
            this.energy -= 2;
            const card = this.stock.pop();
            this.waste.push(card);
            const wastePile = document.getElementById('waste');
            wastePile.innerHTML = '';
            const cardElement = card.createElement();
            wastePile.appendChild(cardElement);
            this.renderStock();
            this.renderEnergy();
        }
    }

    addDragAndDrop() {
        const updateCards = () => {
            document.querySelectorAll('.card').forEach(card => {
                card.draggable = true;
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', card.textContent);
                    e.dataTransfer.setData('source', card.parentElement.id);
                });
            });

            document.querySelectorAll('.pile').forEach(pile => {
                pile.addEventListener('dragover', (e) => e.preventDefault());
                pile.addEventListener('drop', (e) => {
                    e.preventDefault();
                    if (this.energy < 1) return;

                    const cardText = e.dataTransfer.getData('text');
                    const sourceId = e.dataTransfer.getData('source');
                    const cardElement = Array.from(document.querySelectorAll('.card'))
                        .find(card => card.textContent === cardText);
                    if (!cardElement) return;

                    const sourcePile = document.getElementById(sourceId);
                    const targetPile = e.currentTarget;
                    const isFoundation = targetPile.classList.contains('neon-circuit');

                    const card = {
                        suit: cardElement.dataset.suit,
                        rank: cardElement.dataset.rank,
                        isHack: cardElement.dataset.hack === 'true'
                    };

                    if (card.isHack && !this.hackUsed) {
                        this.hackUsed = true;
                        this.stock = [...this.waste, ...this.stock];
                        this.waste = [];
                        this.renderStock();
                        sourcePile.removeChild(cardElement);
                        this.energy -= 5;
                        this.renderEnergy();
                        return;
                    }

                    const pileIndex = parseInt(targetPile.id.split('-')[1]) - 1;
                    const sourceIndex = parseInt(sourceId.split('-')[1]) - 1;

                    if (isFoundation) {
                        const foundationPile = this.foundation[pileIndex];
                        if (this.canPlaceInFoundation(card, foundationPile)) {
                            foundationPile.push(card);
                            targetPile.appendChild(cardElement);
                            cardElement.style.top = '0px';
                            sourcePile.removeChild(cardElement);
                            this.updateSourcePile(sourceId);
                            this.energy -= 1;
                            this.renderEnergy();
                        }
                    } else {
                        const tableauPile = this.tableau[pileIndex];
                        if (this.canPlaceInTableau(card, tableauPile)) {
                            tableauPile.push(card);
                            targetPile.appendChild(cardElement);
                            cardElement.style.top = `${(tableauPile.length - 1) * 30}px`;
                            sourcePile.removeChild(cardElement);
                            this.updateSourcePile(sourceId);
                            this.energy -= 1;
                            this.renderEnergy();
                        }
                    }
                });
            });
        };

        updateCards();
        setInterval(updateCards, 1000); // Refresh listeners periodically
    }

    canPlaceInFoundation(card, pile) {
        if (pile.length === 0) return true;
        const topCard = pile[pile.length - 1];
        const cardValue = this.rankValue(card.rank);
        const topValue = this.rankValue(topCard.rank);
        const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
        const topRed = topCard.suit === 'Hearts' || topCard.suit === 'Diamonds';
        return cardValue === topValue - 1 && isRed !== topRed;
    }

    canPlaceInTableau(card, pile) {
        if (pile.length === 0) return true;
        const topCard = pile[pile.length - 1];
        const cardValue = this.rankValue(card.rank);
        const topValue = this.rankValue(topCard.rank);
        const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
        const topRed = topCard.suit === 'Hearts' || topCard.suit === 'Diamonds';
        return cardValue === topValue - 1 && isRed !== topRed;
    }

    rankValue(rank) {
        const values = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
        return values[rank] || 0;
    }

    updateSourcePile(sourceId) {
        const pileType = sourceId.split('-')[0];
        const pileIndex = parseInt(sourceId.split('-')[1]) - 1;
        if (pileType === 'tableau') {
            this.tableau[pileIndex].pop();
        } else if (pileType === 'foundation') {
            this.foundation[pileIndex].pop();
        } else if (sourceId === 'waste') {
            this.waste.pop();
        }
    }
}

const game = new CyberpunkSolitaire();