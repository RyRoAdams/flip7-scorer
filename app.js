// ============================================================
// FLIP 7 SCORER
// Persistent game + winner detection
// Recent players + Play It Again
// ============================================================

const STORAGE_KEY = "flip7-scorer-game-v1";
const RECENT_PLAYERS_KEY = "flip7-scorer-recent-players-v1";
const LAST_GROUP_KEY = "flip7-scorer-last-group-v1";

const game = {
    players: [],
    round: 1,
    activePlayer: 0,
    entries: [],
    history: [],
    winner: null
};


// ============================================================
// RECENT PLAYER STORAGE
// ============================================================

function getRecentPlayers() {
    try {
        const saved = localStorage.getItem(
            RECENT_PLAYERS_KEY
        );

        if (!saved) {
            return [];
        }

        const players = JSON.parse(saved);

        if (!Array.isArray(players)) {
            return [];
        }

        return players
            .filter(
                name =>
                    typeof name === "string" &&
                    name.trim()
            )
            .map(name => name.trim())
            .filter(
                (name, index, array) =>
                    array.findIndex(
                        item =>
                            item.toLowerCase() ===
                            name.toLowerCase()
                    ) === index
            );

    } catch (error) {
        console.error(
            "Could not load recent players:",
            error
        );

        return [];
    }
}


function saveRecentPlayers(players) {
    const unique = [];

    players.forEach(name => {

        const cleanName =
            String(name).trim();

        if (
            cleanName &&
            !unique.some(
                existing =>
                    existing.toLowerCase() ===
                    cleanName.toLowerCase()
            )
        ) {
            unique.push(cleanName);
        }

    });

    localStorage.setItem(
        RECENT_PLAYERS_KEY,
        JSON.stringify(unique)
    );
}


function rememberPlayers(names) {

    const existing =
        getRecentPlayers();

    saveRecentPlayers([
        ...names,
        ...existing
    ]);

}


function removeRecentPlayer(name) {

    const remaining =
        getRecentPlayers().filter(
            player =>
                player.toLowerCase() !==
                name.toLowerCase()
        );

    saveRecentPlayers(remaining);

    renderSetup();

}


function getLastGroup() {

    try {
        const saved =
            localStorage.getItem(
                LAST_GROUP_KEY
            );

        if (!saved) {
            return [];
        }

        const group =
            JSON.parse(saved);

        if (!Array.isArray(group)) {
            return [];
        }

        return group
            .filter(
                name =>
                    typeof name === "string"
            )
            .map(name => name.trim())
            .filter(Boolean);

    } catch (error) {
        console.error(
            "Could not load last group:",
            error
        );

        return [];
    }

}


function saveLastGroup() {

    const names =
        game.players.map(
            player => player.name
        );

    localStorage.setItem(
        LAST_GROUP_KEY,
        JSON.stringify(names)
    );

}


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
// CUSTOM APP MODALS
// ============================================================

function showModal({
    title,
    message = "",
    input = false,
    confirmText = "OK",
    cancelText = "CANCEL",
    onConfirm = null
}) {

    const existing =
        document.getElementById("appModal");

    if (existing) {
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.id = "appModal";

    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.zIndex = "10000";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.padding = "20px";
    modal.style.background = "rgba(0,0,0,.45)";

    modal.innerHTML = `

        <div
            style="
                width:100%;
                max-width:420px;
                background:var(--panel,#fff);
                color:inherit;
                border-radius:18px;
                padding:24px;
                box-sizing:border-box;
                box-shadow:0 20px 60px rgba(0,0,0,.25);
            "
        >

            <h2
                style="
                    margin:0 0 10px;
                "
            >
                ${escapeHTML(title)}
            </h2>

            ${
                message
                    ? `
                        <p
                            style="
                                margin:0 0 18px;
                            "
                        >
                            ${escapeHTML(message)}
                        </p>
                    `
                    : ""
            }

            ${
                input
                    ? `
                        <input
                            id="modalInput"
                            class="input"
                            type="text"
                            autocomplete="off"
                            style="
                                width:100%;
                                box-sizing:border-box;
                                margin-bottom:18px;
                            "
                        >
                    `
                    : ""
            }

            <div
                style="
                    display:flex;
                    justify-content:flex-end;
                    gap:10px;
                "
            >

                <button
                    class="btn secondary"
                    id="modalCancel"
                >
                    ${escapeHTML(cancelText)}
                </button>

                <button
                    class="btn primary"
                    id="modalConfirm"
                >
                    ${escapeHTML(confirmText)}
                </button>

            </div>

        </div>

    `;

    document.body.appendChild(modal);

    const inputElement =
        document.getElementById("modalInput");

    if (inputElement) {
        inputElement.focus();
    }

    document
        .getElementById("modalCancel")
        .addEventListener(
            "click",
            () => modal.remove()
        );

    document
        .getElementById("modalConfirm")
        .addEventListener(
            "click",
            () => {

                const value =
                    inputElement
                        ? inputElement.value.trim()
                        : true;

                modal.remove();

                if (onConfirm) {
                    onConfirm(value);
                }

            }
        );

    if (inputElement) {

        inputElement.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    document
                        .getElementById(
                            "modalConfirm"
                        )
                        .click();

                }

                if (event.key === "Escape") {

                    document
                        .getElementById(
                            "modalCancel"
                        )
                        .click();

                }

            }
        );

    }

}


function showAlert(message) {

    showModal({
        title: "Flip 7",
        message,
        confirmText: "OK",
        cancelText: "CLOSE"
    });

}


function showConfirm(
    title,
    message,
    onConfirm
) {

    showModal({
        title,
        message,
        confirmText: "CONTINUE",
        cancelText: "CANCEL",
        onConfirm
    });

}


function showNewPlayerModal() {

    showModal({
        title: "New Player",
        message: "Enter the new player's name.",
        input: true,
        confirmText: "ADD PLAYER",
        cancelText: "CANCEL",
        onConfirm: name => {

            if (!name) {
                return;
            }

            addPlayerName(name);

        }
    });

}


function addPlayerName(name) {

    if (game.players.length >= 9) {
        return;
    }

    const cleanName =
        name.trim();

    if (!cleanName) {
        return;
    }

    const duplicate =
        game.players.some(
            player =>
                player.name.toLowerCase() ===
                cleanName.toLowerCase()
        );

    if (duplicate) {

        showAlert(
            "That player is already in the game."
        );

        return;
    }

    rememberPlayers([
        cleanName
    ]);

    game.players.push({
        name: cleanName,
        total: 0
    });

    renderSetup();

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
                    Select previous players or add someone new.
                </p>

                <div
                    id="playAgain"
                    style="margin-top:16px"
                ></div>

                <div
                    id="playerList"
                    class="player-list"
                    style="margin-top:16px"
                ></div>

                <div
                    style="
                        margin-top:18px;
                        padding-top:16px;
                        border-top:1px solid rgba(128,128,128,.2);
                    "
                >

                    <button
                        class="btn secondary full"
                        id="newPlayerButton"
                    >
                        + New Player
                    </button>

                </div>

                <button
                    class="btn primary full"
                    id="startBtn"
                    disabled
                    style="margin-top:16px"
                >
                    Start Game
                </button>

            </section>


            <section
                class="panel"
                style="margin-top:16px"
            >

                <h3 style="margin-top:0">
                    Recent Players
                </h3>

                <div
                    id="recentPlayersList"
                    class="sub"
                ></div>

            </section>

        </div>

    `;


    document
        .getElementById("newPlayerButton")
        .addEventListener(
            "click",
            addNewPlayer
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
// SETUP PLAYER MANAGEMENT
// ============================================================

function addNewPlayer() {

    if (game.players.length >= 9) {
        return;
    }

    showNewPlayerModal();

}


function selectPlayer(index, value) {

    if (value === "__new__") {

        addNewPlayer();

        renderSetup();

        return;
    }

    if (!value) {
        return;
    }

    const duplicate =
        game.players.some(
            (player, playerIndex) =>
                playerIndex !== index &&
                player.name.toLowerCase() ===
                value.toLowerCase()
        );

    if (duplicate) {

        showAlert(
            "That player is already selected."
        );

        renderSetup();

        return;
    }

    const existingPlayer =
        game.players[index];

    if (existingPlayer) {

        existingPlayer.name =
            value;

        existingPlayer.total =
            0;

    } else {

        game.players[index] = {
            name: value,
            total: 0
        };

    }

    rememberPlayers([
        value
    ]);

    renderSetup();

}


function removeSetupPlayer(index) {

    game.players.splice(
        index,
        1
    );

    renderSetup();

}


function playLastGroup() {

    const group =
        getLastGroup();

    if (
        group.length < 3 ||
        group.length > 9
    ) {
        return;
    }

    game.players =
        group.map(
            name => ({
                name,
                total: 0
            })
        );

    rememberPlayers(group);

    startGame();

}


// ============================================================
// PLAYER SETUP DISPLAY
// ============================================================

function renderSetup() {

    const list =
        document.getElementById("playerList");

    const playAgain =
        document.getElementById("playAgain");

    const recentList =
        document.getElementById(
            "recentPlayersList"
        );

    const startButton =
        document.getElementById("startBtn");

    if (!list) {
        return;
    }

    const recentPlayers =
        getRecentPlayers();

    const lastGroup =
        getLastGroup();


    // --------------------------------------------------------
    // PLAY IT AGAIN
    // --------------------------------------------------------

    if (
        playAgain &&
        lastGroup.length >= 3
    ) {

        playAgain.innerHTML = `

            <button
                class="btn primary full"
                id="playAgainButton"
            >
                PLAY IT AGAIN
            </button>

            <div
                class="sub"
                style="
                    text-align:center;
                    margin-top:8px;
                "
            >
                ${lastGroup
                    .map(
                        name =>
                            escapeHTML(name)
                    )
                    .join(" • ")}
            </div>

        `;

        document
            .getElementById(
                "playAgainButton"
            )
            .addEventListener(
                "click",
                playLastGroup
            );

    } else if (playAgain) {

        playAgain.innerHTML = "";

    }


    // --------------------------------------------------------
    // PLAYER DROPDOWNS
    // --------------------------------------------------------

    const slotCount =
        Math.max(
            3,
            Math.min(
                9,
                game.players.length + 1
            )
        );

    let html = "";


    for (
        let index = 0;
        index < slotCount;
        index++
    ) {

        const player =
            game.players[index];

        const selectedName =
            player
                ? player.name
                : "";


        const options = [

            `<option value="">
                Select previous name
            </option>`,

            ...recentPlayers.map(
                name => `

                    <option
                        value="${escapeAttribute(name)}"
                        ${
                            name === selectedName
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHTML(name)}
                    </option>

                `
            ),

            `<option value="__new__">
                + New Player
            </option>`

        ].join("");


        html += `

            <div
                class="player-row"
                style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    margin-bottom:10px;
                "
            >

                <div
                    style="
                        min-width:70px;
                        font-weight:600;
                    "
                >
                    Player ${index + 1}
                </div>


                <select
                    class="input"
                    data-player-select="${index}"
                    style="flex:1"
                >
                    ${options}
                </select>


                ${
                    player
                        ? `

                            <button
                                class="x"
                                data-remove="${index}"
                                title="Remove player"
                            >
                                ×
                            </button>

                        `
                        : ""
                }

            </div>

        `;

    }


    list.innerHTML =
        html;


    // --------------------------------------------------------
    // PLAYER SELECT EVENTS
    // --------------------------------------------------------

    list
        .querySelectorAll(
            "[data-player-select]"
        )
        .forEach(
            select => {

                select.addEventListener(
                    "change",
                    () => {

                        selectPlayer(
                            Number(
                                select.dataset
                                    .playerSelect
                            ),
                            select.value
                        );

                    }
                );

            }
        );


    // --------------------------------------------------------
    // REMOVE PLAYER EVENTS
    // --------------------------------------------------------

    list
        .querySelectorAll(
            "[data-remove]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeSetupPlayer(
                            Number(
                                button.dataset
                                    .remove
                            )
                        );

                    }
                );

            }
        );


    // --------------------------------------------------------
    // RECENT PLAYER MANAGEMENT
    // --------------------------------------------------------

    if (recentList) {

        if (
            recentPlayers.length === 0
        ) {

            recentList.innerHTML =
                "No saved players yet.";

        } else {

            recentList.innerHTML = `

                <div
                    style="
                        display:flex;
                        flex-direction:column;
                        gap:8px;
                    "
                >

                    ${recentPlayers
                        .map(
                            name => `

                                <div
                                    style="
                                        display:flex;
                                        align-items:center;
                                        justify-content:space-between;
                                        gap:10px;
                                    "
                                >

                                    <span>
                                        ${escapeHTML(name)}
                                    </span>

                                    <button
                                        class="x"
                                        data-remove-recent="${escapeAttribute(name)}"
                                        title="Remove saved player"
                                    >
                                        ×
                                    </button>

                                </div>

                            `
                        )
                        .join("")}

                </div>

            `;


            recentList
                .querySelectorAll(
                    "[data-remove-recent]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                const name =
                                    button.dataset
                                        .removeRecent;

                                removeRecentPlayer(
                                    name
                                );

                            }
                        );

                    }
                );

        }

    }


    // --------------------------------------------------------
    // START GAME BUTTON
    // --------------------------------------------------------

    if (startButton) {

        startButton.disabled =
            game.players.length < 3;

    }

}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    if (
        game.players.length < 3
    ) {
        return;
    }

    game.round = 1;

    game.activePlayer = 0;

    game.history = [];

    game.winner = null;


    game.entries =
        game.players.map(
            () => emptyEntry()
        );


    rememberPlayers(
        game.players.map(
            player => player.name
        )
    );


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


    document.getElementById(
        "app"
    ).innerHTML = `

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
                            getRoundEntryCount()
                        }

                        /

                        ${game.players.length}

                        entered

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
        game.players[
            game.winner
        ];


    document.getElementById(
        "app"
    ).innerHTML = `

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

                    ${escapeHTML(
                        winner.name
                    )}

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
                    class="
                        player-tile
                        ${
                            index === game.winner
                                ? "active"
                                : ""
                        }
                    "
                >

                    <div class="name">

                        ${escapeHTML(
                            player.name
                        )}

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


    for (
        let i = 0;
        i < 120;
        i++
    ) {

        const piece =
            document.createElement("div");


        piece.style.position =
            "fixed";


        piece.style.left =
            Math.random() * 100 +
            "vw";


        piece.style.top =
            "-20px";


        piece.style.width =
            (Math.random() * 8 + 5) +
            "px";


        piece.style.height =
            (Math.random() * 12 + 6) +
            "px";


        piece.style.background =
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ];


        piece.style.zIndex =
            "9999";


        piece.style.pointerEvents =
            "none";


        piece.style.transform =
            `rotate(
                ${Math.random() * 360}deg
            )`;


        document.body.appendChild(
            piece
        );


        const fall =
            piece.animate(
                [
                    {
                        transform:
                            `translateY(0)
                             rotate(0deg)`,

                        opacity: 1
                    },

                    {
                        transform:
                            `translateY(110vh)
                             rotate(720deg)`,

                        opacity: 0.9
                    }
                ],

                {
                    duration:
                        Math.random() * 1800 +
                        1800,

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
        .querySelectorAll(
            "[data-player]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        game.activePlayer =
                            Number(
                                button.dataset
                                    .player
                            );


                        saveGame();

                        renderGame();

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-card]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleCard(
                            Number(
                                button.dataset
                                    .card
                            )
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-modifier]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleModifier(
                            Number(
                                button.dataset
                                    .modifier
                            )
                        );

                    }
                );

            }
        );


    document
        .getElementById(
            "doubleButton"
        )
        .addEventListener(
            "click",
            toggleDouble
        );


    document
        .getElementById(
            "clearPlayer"
        )
        .addEventListener(
            "click",
            clearPlayer
        );


    document
        .getElementById(
            "saveRound"
        )
        .addEventListener(
            "click",
            saveRound
        );


    document
        .getElementById(
            "clearRound"
        )
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


                const entered =
                    hasScoreEntry(
                        entry
                    );


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
                                entered
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
                            entered

                                ? `

                                    <div
                                        class="pending-score"
                                    >

                                        Round:

                                        ${
                                            isAutomaticBust(
                                                entry
                                            )
                                                ? "BUST"
                                                : calculateScore(
                                                    entry
                                                )
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
            { length: 13 },
            (_, index) => {

                const number =
                    index;


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


    // Selecting any card means
    // this player is not an automatic bust.

    entry.bust = false;


    if (
        entry.cards.includes(number)
    ) {

        entry.cards =
            entry.cards.filter(
                card =>
                    card !== number
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


    if (
        entry.modifiers.includes(value)
    ) {

        entry.modifiers =
            entry.modifiers.filter(
                modifier =>
                    modifier !== value
            );

    } else {

        entry.modifiers.push(
            value
        );

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


    entry.double =
        !entry.double;


    saveGame();

    renderGame();

}


// ============================================================
// SCORE ENTRY CHECKS
// ============================================================

function hasScoreEntry(entry) {

    if (!entry) {
        return false;
    }


    return (
        entry.cards.length > 0 ||
        entry.modifiers.length > 0 ||
        entry.double === true ||
        entry.bust === true
    );

}


function isAutomaticBust(entry) {

    if (!entry) {
        return true;
    }


    return (
        entry.cards.length === 0 &&
        entry.modifiers.length === 0 &&
        entry.double === false
    );

}


function getRoundEntryCount() {

    return game.entries.filter(
        entry =>
            hasScoreEntry(entry)
    ).length;

}


// ============================================================
// SCORE
// ============================================================

function calculateScore(
    entry = currentEntry()
) {

    // No selections means
    // automatic bust.

    if (
        isAutomaticBust(entry) ||
        entry.bust
    ) {

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


    if (
        isAutomaticBust(entry) ||
        entry.bust
    ) {

        return "No score entered — Bust = 0 points";

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


    if (
        entry.modifiers.length
    ) {

        text +=
            " + " +
            entry.modifiers.join(
                " + "
            );

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


    if (
        isAutomaticBust(entry) ||
        entry.bust
    ) {

        return `
            <span class="bad">
                No score entered — BUST = 0
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

        return `
            <span class="good">
                0 point score entered
            </span>
        `;

    }


    return `

        ${entry.cards.length}

        card${
            entry.cards.length === 1
                ? ""
                : "s"
        }

        entered.

    `;

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
// ROUND CHECKS
// ============================================================

function allPlayersReady() {

    return (
        game.entries.length ===
        game.players.length
    )
    &&
    game.entries.every(
        entry =>
            hasScoreEntry(entry)
    );

}


function hasPendingEntries() {

    return game.entries.some(
        entry =>
            hasScoreEntry(entry)
    );

}
// ============================================================
// SAVE ROUND
// ============================================================

function saveRound() {

    // SAVE ROUND is allowed even when a player
    // has selected nothing. No selection = BUST.

    if (game.players.length < 3) {
        return;
    }


    // Add this round's score
    // to every player's permanent total.

    game.players.forEach(
        (player, index) => {

            const entry =
                game.entries[index];


            // No selection means
            // automatic bust.

            if (
                isAutomaticBust(entry)
            ) {

                entry.bust = true;

            }


            player.total +=
                calculateScore(entry);

        }
    );


    // --------------------------------------------------------
    // SAVE ROUND HISTORY
    // --------------------------------------------------------

    game.history.push({

        round: game.round,

        scores:
            game.entries.map(
                (entry, index) => ({

                    name:
                        game.players[index]
                            .name,

                    score:
                        calculateScore(entry),

                    bust:
                        isAutomaticBust(entry) ||
                        entry.bust

                })
            )

    });


    // --------------------------------------------------------
    // CHECK FOR WINNER
    // --------------------------------------------------------

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


    if (
        playersOver200.length > 0
    ) {

        // Highest score wins.

        playersOver200.sort(
            (a, b) =>
                b.total - a.total
        );


        game.winner =
            playersOver200[0].index;


        // Remember the completed
        // player group for PLAY IT AGAIN.

        saveLastGroup();


        rememberPlayers(
            game.players.map(
                player =>
                    player.name
            )
        );


        saveGame();

        renderWinner();

        return;

    }


    // --------------------------------------------------------
    // NO WINNER YET
    // --------------------------------------------------------

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

    if (
        !hasPendingEntries()
    ) {

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

    showConfirm(
        "Start a New Game?",
        "Your current game will be erased.",
        () => {

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
    );

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


            return entities[
                character
            ];

        }
    );

}


function escapeAttribute(text) {

    return escapeHTML(text);

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