// ============================================================
// FLIP 7 SCORER
// Game logic
// ============================================================


// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------

const game = {

    players: [],

    currentPlayer: 0,

    round: 1,

    selectedCards: [],

    selectedModifiers: [],

    hasDouble: false,

    history: []

};


// ------------------------------------------------------------
// INITIAL SCREEN
// ------------------------------------------------------------

function showSetup() {

    document.getElementById("app").innerHTML = `

        <div class="app-container">

            <header class="app-header">

                <div>

                    <h1>Flip 7</h1>

                    <p>Scoring Companion</p>

                </div>

            </header>


            <main class="setup-card">

                <h2>Who's playing?</h2>

                <p class="instruction">
                    Add 3–9 players to begin.
                </p>


                <div class="player-input">

                    <input
                        id="playerName"
                        type="text"
                        placeholder="Player name"
                        autocomplete="off"
                    >

                    <button
                        class="button primary"
                        onclick="addPlayer()"
                    >
                        Add Player
                    </button>

                </div>


                <div id="playerList"></div>


                <button
                    id="startButton"
                    class="button primary full-width"
                    onclick="startGame()"
                    disabled
                >
                    Start Game
                </button>

            </main>

        </div>

    `;


    document
        .getElementById("playerName")
        .addEventListener("keydown", function(event) {

            if (event.key === "Enter") {

                addPlayer();

            }

        });


    renderPlayerList();

}


// ------------------------------------------------------------
// ADD PLAYER
// ------------------------------------------------------------

function addPlayer() {

    const input =
        document.getElementById("playerName");

    const name =
        input.value.trim();


    if (!name) {

        return;

    }


    if (game.players.length >= 9) {

        return;

    }


    game.players.push({

        name: name,

        score: 0

    });


    input.value = "";


    renderPlayerList();

}


// ------------------------------------------------------------
// PLAYER LIST
// ------------------------------------------------------------

function renderPlayerList() {

    const list =
        document.getElementById("playerList");

    if (!list) {

        return;

    }


    list.innerHTML = game.players
        .map(function(player, index) {

            return `

                <div class="player-row">

                    <span>

                        ${index + 1}.
                        ${escapeHTML(player.name)}

                    </span>

                    <button
                        class="remove-button"
                        onclick="removePlayer(${index})"
                    >
                        ×
                    </button>

                </div>

            `;

        })
        .join("");


    const startButton =
        document.getElementById("startButton");


    if (startButton) {

        startButton.disabled =
            game.players.length < 3;

    }

}


// ------------------------------------------------------------
// REMOVE PLAYER
// ------------------------------------------------------------

function removePlayer(index) {

    game.players.splice(index, 1);

    renderPlayerList();

}


// ------------------------------------------------------------
// START GAME
// ------------------------------------------------------------

function startGame() {

    if (game.players.length < 3) {

        return;

    }


    renderGame();

}


// ------------------------------------------------------------
// MAIN GAME SCREEN
// ------------------------------------------------------------

function renderGame() {

    const player =
        game.players[game.currentPlayer];


    document.getElementById("app").innerHTML = `

        <div class="app-container">


            <header class="game-header">

                <div>

                    <h1>Flip 7</h1>

                    <p>
                        Round ${game.round}
                    </p>

                </div>


                <button
                    class="button secondary"
                    onclick="newGame()"
                >
                    New Game
                </button>

            </header>


            <!-- SCOREBOARD -->

            <section class="scoreboard">

                ${renderScoreboard()}

            </section>


            <!-- CURRENT PLAYER -->

            <section class="game-panel">

                <div class="section-heading">

                    <div>

                        <h2>
                            ${escapeHTML(player.name)}
                        </h2>

                        <p>
                            Select the cards they kept.
                        </p>

                    </div>

                </div>


                <!-- NUMBER CARDS -->

                <h3>Number Cards</h3>

                <div class="card-grid">

                    ${renderNumberCards()}

                </div>


                <!-- SPECIAL CARDS -->

                <h3 class="section-space">
                    Special Cards
                </h3>


                <div class="modifier-grid">

                    ${renderModifierButton(2)}

                    ${renderModifierButton(4)}

                    ${renderModifierButton(6)}

                    ${renderModifierButton(8)}

                    ${renderModifierButton(10)}


                    <button
                        class="
                            modifier-button
                            ${game.hasDouble ? "selected" : ""}
                        "
                        onclick="toggleDouble()"
                    >
                        ×2
                    </button>

                </div>


                <!-- SCORE PREVIEW -->

                <div class="score-preview">

                    <div class="score-label">
                        Current Round
                    </div>


                    <div class="round-score">

                        ${calculateScore()}

                    </div>


                    <div class="score-breakdown">

                        ${getScoreBreakdown()}

                    </div>


                    <div
                        id="gameStatus"
                        class="game-status"
                    >

                        ${getStatusMessage()}

                    </div>


                    <div class="action-buttons">

                        <button
                            class="button primary"
                            onclick="saveScore()"
                        >
                            Save Score
                        </button>


                        <button
                            class="button secondary"
                            onclick="bustPlayer()"
                        >
                            Bust
                        </button>


                        <button
                            class="button secondary"
                            onclick="clearSelection()"
                        >
                            Clear
                        </button>

                    </div>

                </div>

            </section>


            <!-- HISTORY -->

            <section class="game-panel history-panel">

                <h2>Round History</h2>

                ${renderHistory()}

            </section>


        </div>

    `;

}


// ------------------------------------------------------------
// SCOREBOARD
// ------------------------------------------------------------

function renderScoreboard() {

    return game.players
        .map(function(player, index) {

            const active =
                index === game.currentPlayer;


            return `

                <div
                    class="
                        player-card
                        ${active ? "active" : ""}
                    "
                >

                    <div class="player-card-name">

                        ${escapeHTML(player.name)}

                    </div>


                    <div class="player-card-score">

                        ${player.score}

                    </div>


                    <div class="player-card-label">

                        ${active ? "Current turn" : "Score"}

                    </div>

                </div>

            `;

        })
        .join("");

}


// ------------------------------------------------------------
// NUMBER CARDS
// ------------------------------------------------------------

function renderNumberCards() {

    return Array.from(
        { length: 12 },
        function(_, index) {

            const number = index + 1;

            const selected =
                game.selectedCards.includes(number);


            return `

                <button
                    class="
                        number-card
                        ${selected ? "selected" : ""}
                    "
                    onclick="toggleCard(${number})"
                >

                    ${number}

                </button>

            `;

        }
    ).join("");

}


// ------------------------------------------------------------
// MODIFIER BUTTON
// ------------------------------------------------------------

function renderModifierButton(value) {

    const selected =
        game.selectedModifiers.includes(value);


    return `

        <button
            class="
                modifier-button
                ${selected ? "selected" : ""}
            "
            onclick="toggleModifier(${value})"
        >

            +${value}

        </button>

    `;

}


// ------------------------------------------------------------
// SELECT NUMBER CARD
// ------------------------------------------------------------

function toggleCard(number) {

    if (
        game.selectedCards.includes(number)
    ) {

        game.selectedCards =
            game.selectedCards.filter(
                function(card) {

                    return card !== number;

                }
            );

    } else {

        game.selectedCards.push(number);

    }


    renderGame();

}


// ------------------------------------------------------------
// SELECT MODIFIER
// ------------------------------------------------------------

function toggleModifier(value) {

    if (
        game.selectedModifiers.includes(value)
    ) {

        game.selectedModifiers =
            game.selectedModifiers.filter(
                function(modifier) {

                    return modifier !== value;

                }
            );

    } else {

        game.selectedModifiers.push(value);

    }


    renderGame();

}


// ------------------------------------------------------------
// DOUBLE
// ------------------------------------------------------------

function toggleDouble() {

    game.hasDouble =
        !game.hasDouble;


    renderGame();

}


// ------------------------------------------------------------
// CALCULATE SCORE
// ------------------------------------------------------------

function calculateScore() {

    const base =
        game.selectedCards.reduce(
            function(total, card) {

                return total + card;

            },
            0
        );


    const multiplier =
        game.hasDouble ? 2 : 1;


    const modifiers =
        game.selectedModifiers.reduce(
            function(total, modifier) {

                return total + modifier;

            },
            0
        );


    const flipSeven =
        game.selectedCards.length === 7
            ? 15
            : 0;


    return (
        base * multiplier
        + modifiers
        + flipSeven
    );

}


// ------------------------------------------------------------
// SCORE BREAKDOWN
// ------------------------------------------------------------

function getScoreBreakdown() {

    const base =
        game.selectedCards.reduce(
            function(total, card) {

                return total + card;

            },
            0
        );


    let text =
        `Cards: ${base}`;


    if (game.hasDouble) {

        text += " × 2";

    }


    if (game.selectedModifiers.length) {

        text +=
            " + " +
            game.selectedModifiers.join(" + ");

    }


    if (game.selectedCards.length === 7) {

        text += " + 15 Flip 7";

    }


    return text;

}


// ------------------------------------------------------------
// STATUS
// ------------------------------------------------------------

function getStatusMessage() {

    if (game.selectedCards.length === 7) {

        return `
            <span class="success">
                FLIP 7! +15 bonus
            </span>
        `;

    }


    if (game.selectedCards.length === 0) {

        return "Select cards to calculate the score.";

    }


    return `
        ${game.selectedCards.length}
        card${game.selectedCards.length === 1 ? "" : "s"}
        selected
    `;

}


// ------------------------------------------------------------
// SAVE SCORE
// ------------------------------------------------------------

function saveScore() {

    const score =
        calculateScore();


    const player =
        game.players[game.currentPlayer];


    player.score += score;


    game.history.push({

        round: game.round,

        player: player.name,

        score: score,

        bust: false

    });


    nextPlayer();

}


// ------------------------------------------------------------
// BUST
// ------------------------------------------------------------

function bustPlayer() {

    const player =
        game.players[game.currentPlayer];


    game.history.push({

        round: game.round,

        player: player.name,

        score: 0,

        bust: true

    });


    nextPlayer();

}


// ------------------------------------------------------------
// NEXT PLAYER
// ------------------------------------------------------------

function nextPlayer() {

    game.selectedCards = [];

    game.selectedModifiers = [];

    game.hasDouble = false;


    game.currentPlayer++;


    if (
        game.currentPlayer >=
        game.players.length
    ) {

        game.currentPlayer = 0;

        game.round++;

    }


    renderGame();

}


// ------------------------------------------------------------
// CLEAR
// ------------------------------------------------------------

function clearSelection() {

    game.selectedCards = [];

    game.selectedModifiers = [];

    game.hasDouble = false;


    renderGame();

}


// ------------------------------------------------------------
// HISTORY
// ------------------------------------------------------------

function renderHistory() {

    if (!game.history.length) {

        return `
            <p class="empty-history">
                No rounds recorded yet.
            </p>
        `;

    }


    return game.history
        .slice()
        .reverse()
        .map(function(entry) {

            return `

                <div class="history-row">

                    <span>
                        Round ${entry.round}
                    </span>

                    <strong>
                        ${escapeHTML(entry.player)}
                    </strong>

                    <span
                        class="
                            ${entry.bust
                                ? "bust"
                                : ""
                            }
                        "
                    >

                        ${
                            entry.bust
                                ? "BUST"
                                : "+" + entry.score
                        }

                    </span>

                </div>

            `;

        })
        .join("");

}


// ------------------------------------------------------------
// NEW GAME
// ------------------------------------------------------------

function newGame() {

    location.reload();

}


// ------------------------------------------------------------
// SECURITY HELPER
// ------------------------------------------------------------

function escapeHTML(text) {

    return text.replace(
        /[&<>"']/g,
        function(character) {

            const entities = {

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#039;"

            };


            return entities[character];

        }
    );

}


// ------------------------------------------------------------
// START
// ------------------------------------------------------------

showSetup();