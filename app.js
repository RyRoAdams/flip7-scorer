// ============================================================
// FLIP 7 SCORER
// Game Logic
// ============================================================


// ============================================================
// GAME STATE
// ============================================================

const game = {

    players: [],

    round: 1,

    activePlayer: 0,

    // Each player has an entry for the current round.
    // These scores are NOT permanent until SAVE ROUND.
    entries: [],

    history: []

};


// ============================================================
// EMPTY ROUND ENTRY
// ============================================================

function emptyEntry() {

    return {

        cards: [],

        modifiers: [],

        double: false,

        bust: false,

        saved: false

    };

}


// ============================================================
// PLAYER SETUP
// ============================================================

function showSetup() {

    document.getElementById("app").innerHTML = `

        <div class="app">

            <header>

                <div>

                    <h1>Flip 7</h1>

                    <div class="sub">
                        Scoring companion
                    </div>

                </div>

            </header>


            <section class="panel">

                <h2>Who's playing?</h2>

                <p class="sub">
                    Add 3–9 players.
                </p>


                <div
                    class="row"
                    style="margin-top:14px"
                >

                    <input
                        id="nameInput"
                        class="input"
                        placeholder="Player name"
                        autocomplete="off"
                    >


                    <button
                        class="btn primary"
                        id="addBtn"
                    >
                        Add Player
                    </button>

                </div>


                <div
                    id="playerList"
                    class="player-list"
                ></div>


                <button
                    class="btn primary full"
                    id="startBtn"
                    disabled
                >
                    Start Game
                </button>

            </section>

        </div>

    `;


    document
        .getElementById("addBtn")
        .addEventListener(
            "click",
            addPlayer
        );


    document
        .getElementById("nameInput")
        .addEventListener(
            "keydown",
            function(event) {

                if (event.key === "Enter") {

                    addPlayer();

                }

            }
        );


    document
        .getElementById("startBtn")
        .addEventListener(
            "click",
            startGame
        );


    renderSetup();

}


// ============================================================
// ADD PLAYER
// ============================================================

function addPlayer() {

    const input =
        document.getElementById("nameInput");


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

        total: 0

    });


    input.value = "";


    renderSetup();

}


// ============================================================
// PLAYER SETUP DISPLAY
// ============================================================

function renderSetup() {

    const list =
        document.getElementById("playerList");


    if (!list) {

        return;

    }


    list.innerHTML =
        game.players
            .map(
                function(player, index) {

                    return `

                        <div class="player-row">

                            <span>

                                ${index + 1}.
                                ${escapeHTML(player.name)}

                            </span>


                            <button
                                class="x"
                                data-remove="${index}"
                            >
                                ×
                            </button>

                        </div>

                    `;

                }
            )
            .join("");


    list
        .querySelectorAll("[data-remove]")
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        game.players.splice(
                            Number(button.dataset.remove),
                            1
                        );


                        renderSetup();

                    }
                );

            }
        );


    document
        .getElementById("startBtn")
        .disabled =
            game.players.length < 3;

}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    if (game.players.length < 3) {

        return;

    }


    // Create a blank round entry
    // for every player.

    game.entries =
        game.players.map(
            function() {

                return emptyEntry();

            }
        );


    renderGame();

}


// ============================================================
// CURRENT PLAYER ENTRY
// ============================================================

function currentEntry() {

    return game.entries[
        game.activePlayer
    ];

}


// ============================================================
// MAIN GAME SCREEN
// ============================================================

function renderGame() {

    const player =
        game.players[
            game.activePlayer
        ];


    document.getElementById("app").innerHTML = `

        <div class="app">


            <!-- HEADER -->

            <header>

                <div>

                    <h1>Flip 7</h1>

                    <div class="sub">

                        Round ${game.round}

                        • Nothing is final
                        until you save the round

                    </div>

                </div>


                <button
                    class="btn secondary"
                    id="newGame"
                >
                    New Game
                </button>

            </header>


            <!-- SCOREBOARD -->

            <section class="panel">

                <div class="turn">

                    <div>

                        <h2>
                            Round ${game.round}
                        </h2>

                        <p>
                            Tap any player's tile
                            to enter or review them.
                        </p>

                    </div>


                    <strong>

                        ${
                            game.entries.filter(
                                function(entry) {

                                    return entry.saved;

                                }
                            ).length

                        }

                        /

                        ${game.players.length}

                        ready

                    </strong>

                </div>


                <div
                    class="scoreboard"
                    style="margin-top:15px"
                >

                    ${renderScoreboard()}

                </div>

            </section>


            <!-- PLAYER ENTRY -->

            <section
                class="panel"
                style="margin-top:16px"
            >

                <div class="turn">

                    <div>

                        <h2>

                            ${escapeHTML(
                                player.name
                            )}

                        </h2>

                        <p>
                            Enter this player's cards.
                        </p>

                    </div>


                    <strong>

                        Player
                        ${game.activePlayer + 1}
                        of
                        ${game.players.length}

                    </strong>

                </div>


                <!-- NUMBER CARDS -->

                <h3>
                    Number Cards
                </h3>


                <div class="card-grid">

                    ${renderNumberCards()}

                </div>


                <!-- SPECIAL CARDS -->

                <h3>
                    Special Cards
                </h3>


                <div class="mod-grid">

                    ${renderModifier(2)}

                    ${renderModifier(4)}

                    ${renderModifier(6)}

                    ${renderModifier(8)}

                    ${renderModifier(10)}


                    <button
                        class="
                            mod
                            ${
                                currentEntry().double
                                    ? "selected"
                                    : ""
                            }
                        "
                        id="doubleButton"
                    >

                        ×2

                    </button>

                </div>


                <!-- SCORE PREVIEW -->

                <div class="preview">

                    <div class="preview-label">

                        ROUND SCORE

                    </div>


                    <div class="score">

                        ${calculateScore()}

                    </div>


                    <div class="breakdown">

                        ${getBreakdown()}

                    </div>


                    <div class="status">

                        ${getStatus()}

                    </div>


                    <div class="actions">

                        <button
                            class="btn primary"
                            id="savePlayer"
                        >

                            ${
                                currentEntry().saved
                                    ? "Update Player"
                                    : "Save Player"
                            }

                        </button>


                        <button
                            class="btn secondary"
                            id="bustButton"
                        >

                            Bust

                        </button>


                        <button
                            class="btn secondary"
                            id="clearPlayer"
                        >

                            Clear Player

                        </button>

                    </div>

                </div>


                <!-- ROUND CONTROLS -->

                <div class="round-actions">

                    <button
                        class="btn primary"
                        id="saveRound"
                        ${
                            allPlayersReady()
                                ? ""
                                : "disabled"
                        }
                    >

                        SAVE ROUND

                    </button>


                    <button
                        class="btn danger"
                        id="clearRound"
                        ${
                            hasPendingEntries()
                                ? ""
                                : "disabled"
                        }
                    >

                        CLEAR CURRENT ROUND

                    </button>

                </div>

            </section>


            <!-- HISTORY -->

            <section
                class="panel history"
            >

                <h2>
                    Round History
                </h2>


                ${renderHistory()}

            </section>


        </div>

    `;


    connectGameButtons();

}


// ============================================================
// CONNECT GAME BUTTONS
// ============================================================

function connectGameButtons() {

    document
        .getElementById("newGame")
        .addEventListener(
            "click",
            function() {

                location.reload();

            }
        );


    document
        .querySelectorAll("[data-player]")
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        game.activePlayer =
                            Number(
                                button.dataset.player
                            );


                        renderGame();

                    }
                );

            }
        );


    document
        .querySelectorAll("[data-card]")
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        toggleCard(
                            Number(
                                button.dataset.card
                            )
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll("[data-modifier]")
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        toggleModifier(
                            Number(
                                button.dataset.modifier
                            )
                        );

                    }
                );

            }
        );


    document
        .getElementById("doubleButton")
        .addEventListener(
            "click",
            toggleDouble
        );


    document
        .getElementById("savePlayer")
        .addEventListener(
            "click",
            savePlayerEntry
        );


    document
        .getElementById("bustButton")
        .addEventListener(
            "click",
            bustPlayer
        );


    document
        .getElementById("clearPlayer")
        .addEventListener(
            "click",
            clearPlayer
        );


    document
        .getElementById("saveRound")
        .addEventListener(
            "click",
            saveRound
        );


    document
        .getElementById("clearRound")
        .addEventListener(
            "click",
            clearCurrentRound
        );

}


// ============================================================
// SCOREBOARD
// ============================================================

function renderScoreboard() {

    return game.players
        .map(
            function(player, index) {

                const entry =
                    game.entries[index];


                return `

                    <button
                        class="
                            player-tile
                            ${
                                index ===
                                game.activePlayer
                                    ? "active"
                                    : ""
                            }

                            ${
                                entry.saved
                                    ? "pending"
                                    : ""
                            }
                        "

                        data-player="${index}"
                    >

                        <div class="name">

                            ${escapeHTML(
                                player.name
                            )}

                        </div>


                        <div class="total">

                            ${player.total}

                        </div>


                        ${
                            entry.saved

                                ? `

                                    <div
                                        class="
                                            pending-score
                                        "
                                    >

                                        Round:

                                        ${
                                            entry.bust
                                                ? "BUST"
                                                : calculateScore(
                                                    entry
                                                )
                                        }

                                    </div>

                                `

                                : `

                                    <div
                                        class="
                                            tile-label
                                        "
                                    >

                                        Not entered

                                    </div>

                                `
                        }

                    </button>

                `;

            }
        )
        .join("");

}


// ============================================================
// NUMBER CARDS
// ============================================================

function renderNumberCards() {

    const entry =
        currentEntry();


    return Array
        .from(
            { length: 12 },
            function(_, index) {

                const number =
                    index + 1;


                const selected =
                    entry.cards.includes(
                        number
                    );


                return `

                    <button
                        class="
                            number
                            ${
                                selected
                                    ? "selected"
                                    : ""
                            }
                        "

                        data-card="${number}"
                    >

                        ${number}

                    </button>

                `;

            }
        )
        .join("");

}


// ============================================================
// MODIFIER BUTTON
// ============================================================

function renderModifier(value) {

    const selected =
        currentEntry()
            .modifiers
            .includes(value);


    return `

        <button
            class="
                mod
                ${
                    selected
                        ? "selected"
                        : ""
                }
            "

            data-modifier="${value}"
        >

            +${value}

        </button>

    `;

}


// ============================================================
// SELECT NUMBER CARD
// ============================================================

function toggleCard(number) {

    const entry =
        currentEntry();


    entry.bust = false;

    entry.saved = false;


    if (
        entry.cards.includes(number)
    ) {

        entry.cards =
            entry.cards.filter(
                function(card) {

                    return card !== number;

                }
            );

    } else {

        entry.cards.push(number);

    }


    renderGame();

}


// ============================================================
// SELECT MODIFIER
// ============================================================

function toggleModifier(value) {

    const entry =
        currentEntry();


    entry.bust = false;

    entry.saved = false;


    if (
        entry.modifiers.includes(value)
    ) {

        entry.modifiers =
            entry.modifiers.filter(
                function(modifier) {

                    return modifier !== value;

                }
            );

    } else {

        entry.modifiers.push(value);

    }


    renderGame();

}


// ============================================================
// ×2
// ============================================================

function toggleDouble() {

    const entry =
        currentEntry();


    entry.bust = false;

    entry.saved = false;


    entry.double =
        !entry.double;


    renderGame();

}


// ============================================================
// CALCULATE SCORE
// ============================================================

function calculateScore(entry = currentEntry()) {

    if (entry.bust) {

        return 0;

    }


    const base =
        entry.cards.reduce(
            function(total, card) {

                return total + card;

            },
            0
        );


    const modifiers =
        entry.modifiers.reduce(
            function(total, modifier) {

                return total + modifier;

            },
            0
        );


    const multiplier =
        entry.double
            ? 2
            : 1;


    const flipSeven =
        entry.cards.length === 7
            ? 15
            : 0;


    return (
        base * multiplier
        + modifiers
        + flipSeven
    );

}


// ============================================================
// SCORE BREAKDOWN
// ============================================================

function getBreakdown() {

    const entry =
        currentEntry();


    if (entry.bust) {

        return "Bust = 0 points";

    }


    const base =
        entry.cards.reduce(
            function(total, card) {

                return total + card;

            },
            0
        );


    let text =
        `Cards: ${base}`;


    if (entry.double) {

        text += " × 2";

    }


    if (entry.modifiers.length) {

        text +=
            " + " +
            entry.modifiers.join(" + ");

    }


    if (
        entry.cards.length === 7
    ) {

        text +=
            " + 15 Flip 7";

    }


    return text;

}


// ============================================================
// STATUS
// ============================================================

function getStatus() {

    const entry =
        currentEntry();


    if (entry.bust) {

        return `
            <span class="bad">

                BUST — 0 points

            </span>
        `;

    }


    if (
        entry.cards.length === 7
    ) {

        return `
            <span class="good">

                FLIP 7 — +15 bonus

            </span>
        `;

    }


    if (
        entry.cards.length === 0
    ) {

        return "No cards entered yet.";

    }


    return `

        ${entry.cards.length}

        card${entry.cards.length === 1
            ? ""
            : "s"}

        entered.

    `;

}


// ============================================================
// SAVE INDIVIDUAL PLAYER ENTRY
// ============================================================

function savePlayerEntry() {

    const entry =
        currentEntry();


    entry.bust = false;

    entry.saved = true;


    renderGame();

}


// ============================================================
// BUST
// ============================================================

function bustPlayer() {

    const entry =
        currentEntry();


    entry.cards = [];

    entry.modifiers = [];

    entry.double = false;

    entry.bust = true;

    entry.saved = true;


    renderGame();

}


// ============================================================
// CLEAR ONE PLAYER
// ============================================================

function clearPlayer() {

    game.entries[
        game.activePlayer
    ] = emptyEntry();


    renderGame();

}


// ============================================================
// ARE ALL PLAYERS READY?
// ============================================================

function allPlayersReady() {

    return game.entries.length ===
        game.players.length

        &&

        game.entries.every(
            function(entry) {

                return entry.saved;

            }
        );

}


// ============================================================
// DOES CURRENT ROUND HAVE ANY ENTRIES?
// ============================================================

function hasPendingEntries() {

    return game.entries.some(
        function(entry) {

            return entry.saved;

        }
    );

}


// ============================================================
// SAVE ENTIRE ROUND
// ============================================================

function saveRound() {

    if (!allPlayersReady()) {

        return;

    }


    // Permanently add this round
    // to every player's total.

    game.players.forEach(
        function(player, index) {

            player.total +=
                calculateScore(
                    game.entries[index]
                );

        }
    );


    // Save a permanent copy
    // of this round's results.

    game.history.push({

        round: game.round,

        scores:
            game.entries.map(
                function(entry, index) {

                    return {

                        name:
                            game.players[index]
                                .name,

                        score:
                            calculateScore(
                                entry
                            ),

                        bust:
                            entry.bust

                    };

                }
            )

    });


    // Start a brand-new round.

    game.round++;

    game.entries =
        game.players.map(
            function() {

                return emptyEntry();

            }
        );


    game.activePlayer = 0;


    renderGame();

}


// ============================================================
// CLEAR CURRENT ROUND
// ============================================================

function clearCurrentRound() {

    if (!hasPendingEntries()) {

        return;

    }


    // IMPORTANT:
    //
    // We have NOT added these scores
    // to permanent totals yet.
    //
    // Therefore clearing the round
    // simply throws away the entries.

    game.entries =
        game.players.map(
            function() {

                return emptyEntry();

            }
        );


    game.activePlayer = 0;


    renderGame();

}


// ============================================================
// HISTORY
// ============================================================

function renderHistory() {

    if (
        game.history.length === 0
    ) {

        return `

            <div class="empty">

                No completed rounds yet.

            </div>

        `;

    }


    return game.history
        .slice()
        .reverse()
        .map(
            function(round) {

                return `

                    <div
                        style="
                            margin-bottom:12px
                        "
                    >

                        <strong>

                            Round
                            ${round.round}

                        </strong>


                        ${
                            round.scores
                                .map(
                                    function(result) {

                                        return `

                                            <div
                                                class="
                                                    history-row
                                                "
                                            >

                                                <span>

                                                    ${escapeHTML(
                                                        result.name
                                                    )}

                                                </span>


                                                <span>

                                                    ${
                                                        result.bust
                                                            ? "BUST"
                                                            : "Round score"
                                                    }

                                                </span>


                                                <span>

                                                    ${
                                                        result.bust
                                                            ? "0"
                                                            : "+" +
                                                              result.score
                                                    }

                                                </span>

                                            </div>

                                        `;

                                    }
                                )
                                .join("")
                        }

                    </div>

                `;

            }
        )
        .join("");

}


// ============================================================
// BASIC HTML SAFETY
// ============================================================

function escapeHTML(text) {

    return String(text).replace(
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


// ============================================================
// START APPLICATION
// ============================================================

showSetup();