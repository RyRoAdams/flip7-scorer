// ============================================================
// FLIP 7 SCORER
// Persistent game + winner detection
// ============================================================

const STORAGE_KEY = "flip7-scorer-game-v1";

const game = {
    players: [],
    round: 1,
    activePlayer: 0,
    entries: [],
    history: [],
    winner: null
};


// ============================================================
// SAVE / LOAD GAME
// ============================================================

function saveGame() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(game)
    );
}


function loadGame() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return false;
    }

    try {
        const loaded = JSON.parse(saved);

        if (
            !loaded ||
            !Array.isArray(loaded.players) ||
            !Array.isArray(loaded.entries)
        ) {
            return false;
        }

        game.players = loaded.players;
        game.round = loaded.round || 1;
        game.activePlayer = loaded.activePlayer || 0;
        game.entries = loaded.entries;
        game.history = loaded.history || [];
        game.winner = loaded.winner || null;

        return game.players.length >= 3;

    } catch (error) {
        console.error("Could not load saved game:", error);
        return false;
    }
}


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
// SETUP
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
        .addEventListener("click", addPlayer);


    document
        .getElementById("nameInput")
        .addEventListener(
            "keydown",
            event => {

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
                (player, index) => `

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

                `
            )
            .join("");


    list
        .querySelectorAll("[data-remove]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    game.players.splice(
                        Number(button.dataset.remove),
                        1
                    );

                    renderSetup();

                }
            );

        });


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


    game.round = 1;
    game.activePlayer = 0;
    game.history = [];
    game.winner = null;


    game.entries =
        game.players.map(() => emptyEntry());


    saveGame();

    renderGame();
}


// ============================================================
// CURRENT ENTRY
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

    if (game.winner) {
        renderWinner();
        return;
    }


    const player =
        game.players[
            game.activePlayer
        ];


    document.getElementById("app").innerHTML = `

        <div class="app">

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
                                entry => entry.saved
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


            <section
                class="panel"
                style="margin-top:16px"
            >

                <div class="turn">

                    <div>

                        <h2>
                            ${escapeHTML(player.name)}
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


                <h3>
                    Number Cards
                </h3>


                <div class="card-grid">

                    ${renderNumberCards()}

                </div>


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


            <section class="panel history">

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
// WINNER SCREEN
// ============================================================

function renderWinner() {

    const winner =
        game.players[game.winner];


    document.getElementById("app").innerHTML = `

        <div class="app">

            <section
                class="panel"
                style="
                    text-align:center;
                    padding:40px 20px;
                "
            >

                <div
                    style="
                        font-size:64px;
                        margin-bottom:10px;
                    "
                >
                    🏆
                </div>


                <h1>
                    ${escapeHTML(winner.name)}
                    WINS!
                </h1>


                <p class="sub">
                    Final score:
                    <strong>
                        ${winner.total}
                    </strong>
                </p>


                <div
                    class="scoreboard"
                    style="margin-top:25px"
                >

                    ${renderFinalScores()}

                </div>


                <button
                    class="btn primary full"
                    id="newGame"
                >
                    NEW GAME
                </button>

            </section>

        </div>

    `;


    document
        .getElementById("newGame")
        .addEventListener(
            "click",
            startNewGame
        );


    launchConfetti();
}


// ============================================================
// FINAL SCORES
// ============================================================

function renderFinalScores() {

    return game.players
        .map(
            (player, index) => `

                <div
                    class="player-tile
                        ${
                            index === game.winner
                                ? "active"
                                : ""
                        }
                    "
                >

                    <div class="name">
                        ${escapeHTML(player.name)}
                    </div>

                    <div class="total">
                        ${player.total}
                    </div>

                </div>

            `
        )
        .join("");

}


// ============================================================
// CONFETTI
// ============================================================

function launchConfetti() {

    const colors = [
        "#5b5ce2",
        "#059669",
        "#f59e0b",
        "#dc3545",
        "#0ea5e9",
        "#ec4899"
    ];


    for (let i = 0; i < 120; i++) {

        const piece =
            document.createElement("div");


        piece.style.position = "fixed";
        piece.style.left =
            Math.random() * 100 + "vw";

        piece.style.top = "-20px";

        piece.style.width =
            (Math.random() * 8 + 5) + "px";

        piece.style.height =
            (Math.random() * 12 + 6) + "px";

        piece.style.background =
            colors[
                Math.floor(
                    Math.random() * colors.length
                )
            ];

        piece.style.zIndex = "9999";
        piece.style.pointerEvents = "none";

        piece.style.transform =
            `rotate(${Math.random() * 360}deg)`;


        document.body.appendChild(piece);


        const fall =
            piece.animate(
                [
                    {
                        transform:
                            `translateY(0) rotate(0deg)`,
                        opacity: 1
                    },

                    {
                        transform:
                            `translateY(110vh) rotate(720deg)`,
                        opacity: 0.9
                    }
                ],
                {
                    duration:
                        Math.random() * 1800 + 1800,

                    delay:
                        Math.random() * 500,

                    easing:
                        "cubic-bezier(.2,.7,.3,1)"
                }
            );


        fall.onfinish =
            () => piece.remove();

    }

}


// ============================================================
// CONNECT BUTTONS
// ============================================================

function connectGameButtons() {

    document
        .getElementById("newGame")
        .addEventListener(
            "click",
            startNewGame
        );


    document
        .querySelectorAll("[data-player]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    game.activePlayer =
                        Number(
                            button.dataset.player
                        );

                    saveGame();

                    renderGame();

                }
            );

        });


    document
        .querySelectorAll("[data-card]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleCard(
                        Number(
                            button.dataset.card
                        )
                    );

                }
            );

        });


    document
        .querySelectorAll("[data-modifier]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleModifier(
                        Number(
                            button.dataset.modifier
                        )
                    );

                }
            );

        });


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
            (player, index) => {

                const entry =
                    game.entries[index];


                return `

                    <button
                        class="
                            player-tile
                            ${
                                index === game.activePlayer
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

                            ${escapeHTML(player.name)}

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
                                                : calculateScore(entry)
                                        }

                                    </div>

                                `

                                : `

                                    <div
                                        class="tile-label"
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
            (_, index) => {

                const number =
                    index + 1;


                const selected =
                    entry.cards.includes(number);


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
// MODIFIER
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
// CARD TOGGLE
// ============================================================

function toggleCard(number) {

    const entry =
        currentEntry();


    entry.bust = false;
    entry.saved = false;


    if (entry.cards.includes(number)) {

        entry.cards =
            entry.cards.filter(
                card => card !== number
            );

    } else {

        entry.cards.push(number);

    }


    saveGame();

    renderGame();

}


// ============================================================
// MODIFIER TOGGLE
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
                modifier => modifier !== value
            );

    } else {

        entry.modifiers.push(value);

    }


    saveGame();

    renderGame();

}


// ============================================================
// DOUBLE
// ============================================================

function toggleDouble() {

    const entry =
        currentEntry();


    entry.bust = false;
    entry.saved = false;


    entry.double =
        !entry.double;


    saveGame();

    renderGame();

}


// ============================================================
// SCORE
// ============================================================

function calculateScore(
    entry = currentEntry()
) {

    if (entry.bust) {
        return 0;
    }


    const base =
        entry.cards.reduce(
            (total, card) =>
                total + card,
            0
        );


    const modifiers =
        entry.modifiers.reduce(
            (total, modifier) =>
                total + modifier,
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
// BREAKDOWN
// ============================================================

function getBreakdown() {

    const entry =
        currentEntry();


    if (entry.bust) {
        return "Bust = 0 points";
    }


    const base =
        entry.cards.reduce(
            (total, card) =>
                total + card,
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


    if (entry.cards.length === 7) {

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


    if (entry.cards.length === 7) {

        return `
            <span class="good">
                FLIP 7 — +15 bonus
            </span>
        `;

    }


    if (entry.cards.length === 0) {

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
// SAVE PLAYER
// ============================================================

function savePlayerEntry() {

    const entry =
        currentEntry();


    entry.bust = false;
    entry.saved = true;


    saveGame();

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


    saveGame();

    renderGame();

}


// ============================================================
// CLEAR PLAYER
// ============================================================

function clearPlayer() {

    game.entries[
        game.activePlayer
    ] = emptyEntry();


    saveGame();

    renderGame();

}


// ============================================================
// READY CHECK
// ============================================================

function allPlayersReady() {

    return (
        game.entries.length ===
        game.players.length
    )
    &&
    game.entries.every(
        entry => entry.saved
    );

}


// ============================================================
// PENDING CHECK
// ============================================================

function hasPendingEntries() {

    return game.entries.some(
        entry => entry.saved
    );

}


// ============================================================
// SAVE ROUND
// ============================================================

function saveRound() {

    if (!allPlayersReady()) {
        return;
    }


    // Add this round's score
    // to every player's permanent total.

    game.players.forEach(
        (player, index) => {

            player.total +=
                calculateScore(
                    game.entries[index]
                );

        }
    );


    // Save round history.

    game.history.push({

        round: game.round,

        scores:
            game.entries.map(
                (entry, index) => ({

                    name:
                        game.players[index].name,

                    score:
                        calculateScore(entry),

                    bust:
                        entry.bust

                })
            )

    });


    // ========================================================
    // CHECK FOR WINNER
    // ========================================================

    const playersOver200 =
        game.players
            .map(
                (player, index) => ({
                    index: index,
                    total: player.total
                })
            )
            .filter(
                player =>
                    player.total >= 200
            );


    if (playersOver200.length > 0) {

        // Highest score wins.

        playersOver200.sort(
            (a, b) =>
                b.total - a.total
        );


        game.winner =
            playersOver200[0].index;


        saveGame();

        renderWinner();

        return;

    }


    // ========================================================
    // NO WINNER YET
    // ========================================================

    game.round++;

    game.entries =
        game.players.map(
            () => emptyEntry()
        );


    game.activePlayer = 0;


    saveGame();

    renderGame();

}


// ============================================================
// CLEAR CURRENT ROUND
// ============================================================

function clearCurrentRound() {

    if (!hasPendingEntries()) {
        return;
    }


    game.entries =
        game.players.map(
            () => emptyEntry()
        );


    game.activePlayer = 0;


    saveGame();

    renderGame();

}


// ============================================================
// NEW GAME
// ============================================================

function startNewGame() {

    const confirmed =
        confirm(
            "Start a new game? Your current game will be erased."
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        STORAGE_KEY
    );


    game.players = [];
    game.round = 1;
    game.activePlayer = 0;
    game.entries = [];
    game.history = [];
    game.winner = null;


    showSetup();

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
            round => `

                <div
                    style="
                        margin-bottom:12px
                    "
                >

                    <strong>
                        Round ${round.round}
                    </strong>


                    ${
                        round.scores
                            .map(
                                result => `

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

                                `
                            )
                            .join("")
                    }

                </div>

            `
        )
        .join("");

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(text) {

    return String(text).replace(
        /[&<>"']/g,
        character => {

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
// APP STARTUP
// ============================================================

if (loadGame()) {

    if (game.winner) {

        renderWinner();

    } else {

        renderGame();

    }

} else {

    showSetup();

}