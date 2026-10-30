<?php
// Ludo Game - PHP & HTML5 Fullstack Entry
$isPhpActive = true;
$phpVersion = PHP_VERSION;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Ludo Royal - Premium Board Game</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎲</text></svg>">
</head>
<body>

    <!-- Header Navigation -->
    <header class="app-header">
        <div class="logo-wrap">
            <div class="logo-dice-icon">🎲</div>
            <h1 class="app-title">Ludo <span>Royal</span></h1>
        </div>
        <div class="header-controls">
            <button id="btnMute" class="btn-icon" title="Toggle Sound">🔊</button>
            <button id="btnRules" class="btn-icon" title="How to Play">📖</button>
            <button id="btnLeaderboard" class="btn-icon" title="Hall of Fame">🏆</button>
            <button id="btnRoom" class="btn-pill btn-outline">
                <span>🌐 Online Room</span>
            </button>
            <button id="btnNewGame" class="btn-pill btn-primary">
                <span>⚡ New Game</span>
            </button>
        </div>
    </header>

    <!-- Main Game Container -->
    <main class="game-container">

        <!-- Left Side Panel (Red & Blue) -->
        <aside class="side-panel">
            <!-- Red Player Card -->
            <div id="playerCard_red" class="player-card red">
                <div class="player-header">
                    <div class="player-info-group">
                        <div class="player-avatar red">R</div>
                        <div class="player-name-wrap">
                            <span class="player-title">Red</span>
                            <span class="player-badge">Player 1</span>
                        </div>
                    </div>
                    <span class="player-status-pill">Waiting</span>
                </div>
                <div class="token-progress">
                    <div class="token-progress-item">Yard: <strong class="count-yard">4</strong></div>
                    <div class="token-progress-item">Board: <strong class="count-track">0</strong></div>
                    <div class="token-progress-item">Home: <strong class="count-home">0</strong></div>
                </div>
            </div>

            <!-- Blue Player Card -->
            <div id="playerCard_blue" class="player-card blue">
                <div class="player-header">
                    <div class="player-info-group">
                        <div class="player-avatar blue">B</div>
                        <div class="player-name-wrap">
                            <span class="player-title">Blue</span>
                            <span class="player-badge bot">Bot</span>
                        </div>
                    </div>
                    <span class="player-status-pill">Waiting</span>
                </div>
                <div class="token-progress">
                    <div class="token-progress-item">Yard: <strong class="count-yard">4</strong></div>
                    <div class="token-progress-item">Board: <strong class="count-track">0</strong></div>
                    <div class="token-progress-item">Home: <strong class="count-home">0</strong></div>
                </div>
            </div>
        </aside>

        <!-- Center Area (Board) -->
        <section class="board-center-area">
            <!-- 15x15 Ludo Board -->
            <div id="boardWrapper" class="board-wrapper">
                <div id="ludoGrid" class="ludo-grid">
                    <!-- Injected dynamically by board.js / app.js -->
                </div>
                <!-- Floating Layer for Animated Tokens -->
                <div id="tokensLayer" class="tokens-layer"></div>
            </div>
        </section>

        <!-- Right Side Panel (Upper Right Controls, Green & Yellow) -->
        <aside class="side-panel right-panel">
            <!-- Upper Right Dice Controls Dashboard -->
            <div class="dice-dashboard">
                <div class="turn-message-box">
                    <span class="turn-heading">Current Turn</span>
                    <span id="turnPlayerName" class="turn-player-name">Red's Turn</span>
                </div>

                <div class="dice-action-wrap">
                    <!-- 3D Dice Cube -->
                    <div class="dice-container" title="Click to Roll">
                        <div id="diceCube" class="dice-cube glow-red">
                            <div class="dice-pip" style="grid-row:2; grid-column:2;"></div>
                        </div>
                    </div>

                    <button id="btnRoll" class="btn-roll">
                        <span>🎲 Roll Dice</span>
                        <small style="opacity: 0.8; font-size: 0.72rem;">[Space]</small>
                    </button>
                </div>
            </div>

            <!-- Game Activity Log Ticker -->
            <div class="game-log-ticker">
                <span class="log-icon">🎲</span>
                <span id="logContent" class="log-content">Game started! Roll dice to begin.</span>
            </div>

            <!-- Green Player Card -->
            <div id="playerCard_green" class="player-card green">
                <div class="player-header">
                    <div class="player-info-group">
                        <div class="player-avatar green">G</div>
                        <div class="player-name-wrap">
                            <span class="player-title">Green</span>
                            <span class="player-badge bot">Bot</span>
                        </div>
                    </div>
                    <span class="player-status-pill">Waiting</span>
                </div>
                <div class="token-progress">
                    <div class="token-progress-item">Yard: <strong class="count-yard">4</strong></div>
                    <div class="token-progress-item">Board: <strong class="count-track">0</strong></div>
                    <div class="token-progress-item">Home: <strong class="count-home">0</strong></div>
                </div>
            </div>

            <!-- Yellow Player Card -->
            <div id="playerCard_yellow" class="player-card yellow">
                <div class="player-header">
                    <div class="player-info-group">
                        <div class="player-avatar yellow">Y</div>
                        <div class="player-name-wrap">
                            <span class="player-title">Yellow</span>
                            <span class="player-badge bot">Bot</span>
                        </div>
                    </div>
                    <span class="player-status-pill">Waiting</span>
                </div>
                <div class="token-progress">
                    <div class="token-progress-item">Yard: <strong class="count-yard">4</strong></div>
                    <div class="token-progress-item">Board: <strong class="count-track">0</strong></div>
                    <div class="token-progress-item">Home: <strong class="count-home">0</strong></div>
                </div>
            </div>
        </aside>

    </main>

    <!-- Modal: New Game / Player Configuration -->
    <div id="modalNewGame" class="modal-overlay">
        <div class="modal-dialog">
            <div class="modal-header">
                <h2 class="modal-title">Configure Game</h2>
                <button class="btn-close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.2rem;">
                    Customize players and select whether each color is controlled by a human or computer AI.
                </p>

                <!-- Red Config -->
                <div class="player-config-row">
                    <div class="player-config-color-badge red"></div>
                    <input type="text" id="cfgNameRed" class="form-input" value="Red" placeholder="Player Name">
                    <select id="cfgTypeRed" class="form-select">
                        <option value="human" selected>Human</option>
                        <option value="bot">Computer (AI)</option>
                    </select>
                </div>

                <!-- Green Config -->
                <div class="player-config-row">
                    <div class="player-config-color-badge green"></div>
                    <input type="text" id="cfgNameGreen" class="form-input" value="Green" placeholder="Player Name">
                    <select id="cfgTypeGreen" class="form-select">
                        <option value="human">Human</option>
                        <option value="bot" selected>Computer (AI)</option>
                        <option value="inactive">Disabled</option>
                    </select>
                </div>

                <!-- Yellow Config -->
                <div class="player-config-row">
                    <div class="player-config-color-badge yellow"></div>
                    <input type="text" id="cfgNameYellow" class="form-input" value="Yellow" placeholder="Player Name">
                    <select id="cfgTypeYellow" class="form-select">
                        <option value="human">Human</option>
                        <option value="bot" selected>Computer (AI)</option>
                        <option value="inactive">Disabled</option>
                    </select>
                </div>

                <!-- Blue Config -->
                <div class="player-config-row">
                    <div class="player-config-color-badge blue"></div>
                    <input type="text" id="cfgNameBlue" class="form-input" value="Blue" placeholder="Player Name">
                    <select id="cfgTypeBlue" class="form-select">
                        <option value="human">Human</option>
                        <option value="bot" selected>Computer (AI)</option>
                        <option value="inactive">Disabled</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-pill btn-outline btn-modal-cancel">Cancel</button>
                <button id="btnStartGameConfirm" class="btn-pill btn-primary">Start Match</button>
            </div>
        </div>
    </div>

    <!-- Modal: Online Room Multiplayer (PHP Backend) -->
    <div id="modalRoom" class="modal-overlay">
        <div class="modal-dialog">
            <div class="modal-header">
                <h2 class="modal-title">PHP Multiplayer Room</h2>
                <button class="btn-close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="tabCreateRoom">Create Room</button>
                    <button class="tab-btn" data-tab="tabJoinRoom">Join Room</button>
                </div>

                <!-- Create Room Tab -->
                <div id="tabCreateRoom" class="room-tab-content">
                    <div class="form-group">
                        <label class="form-label">Your Name</label>
                        <input type="text" id="roomHostName" class="form-input" value="Host Player" style="width:100%;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Choose Your Color</label>
                        <select id="roomHostColor" class="form-select" style="width:100%;">
                            <option value="red" selected>Red</option>
                            <option value="green">Green</option>
                            <option value="yellow">Yellow</option>
                            <option value="blue">Blue</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Number of Players</label>
                        <select id="roomPlayerCount" class="form-select" style="width:100%;">
                            <option value="2">2 Players</option>
                            <option value="3">3 Players</option>
                            <option value="4" selected>4 Players</option>
                        </select>
                    </div>
                    <button id="btnCreateRoomSubmit" class="btn-pill btn-primary" style="width:100%; justify-content:center; margin-top:1rem;">
                        Generate Room Code
                    </button>
                </div>

                <!-- Join Room Tab -->
                <div id="tabJoinRoom" class="room-tab-content" style="display:none;">
                    <div class="form-group">
                        <label class="form-label">Room Code (4 Letters)</label>
                        <input type="text" id="joinRoomCode" class="form-input" placeholder="e.g. 7XKQ" maxlength="6" style="width:100%; text-transform:uppercase; font-size:1.2rem; letter-spacing:2px; font-weight:700;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Your Name</label>
                        <input type="text" id="joinPlayerName" class="form-input" value="Guest" style="width:100%;">
                    </div>
                    <button id="btnJoinRoomSubmit" class="btn-pill btn-primary" style="width:100%; justify-content:center; margin-top:1rem;">
                        Join Match
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Hall of Fame Leaderboard -->
    <div id="modalLeaderboard" class="modal-overlay">
        <div class="modal-dialog">
            <div class="modal-header">
                <h2 class="modal-title">🏆 Hall of Fame</h2>
                <button class="btn-close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Winner</th>
                            <th>Turns</th>
                            <th>Captures</th>
                        </tr>
                    </thead>
                    <tbody id="leaderboardList">
                        <!-- Populated by PHP API -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Modal: Rules & How to Play -->
    <div id="modalRules" class="modal-overlay">
        <div class="modal-dialog">
            <div class="modal-header">
                <h2 class="modal-title">Ludo Rules & Guide</h2>
                <button class="btn-close-modal">&times;</button>
            </div>
            <div class="modal-body" style="font-size:0.92rem; line-height:1.6; color:var(--text-muted);">
                <p><strong style="color:#ffffff;">1. Exiting the Yard:</strong> A player must roll a <strong style="color:#ffa502;">6</strong> to move a token from their Yard onto the starting square.</p>
                <br>
                <p><strong style="color:#ffffff;">2. Extra Turns:</strong> Rolling a <strong style="color:#ffa502;">6</strong>, capturing an opponent piece, or guiding a token Home awards an immediate bonus roll!</p>
                <br>
                <p><strong style="color:#ffffff;">3. Three 6s Penalty:</strong> Rolling three consecutive 6s forfeits the third roll and passes turn to the next player.</p>
                <br>
                <p><strong style="color:#ffffff;">4. Capturing:</strong> If a token lands on an opponent's token on an ordinary square, the opponent's piece is knocked back to its Yard.</p>
                <br>
                <p><strong style="color:#ffffff;">5. Safe Spots (Stars):</strong> Tokens resting on squares with a <strong style="color:#f59e0b;">★ Star</strong> cannot be captured. Multiple pieces may share safe spots.</p>
                <br>
                <p><strong style="color:#ffffff;">6. Reaching Home:</strong> Tokens must travel the full circuit and enter their colored home column. An exact roll is required to reach the center crown!</p>
            </div>
        </div>
    </div>

    <!-- Modal: Victory Celebration -->
    <div id="modalVictory" class="modal-overlay">
        <div class="modal-dialog" style="text-align:center;">
            <div class="victory-podium">
                <div class="trophy-bounce">🏆</div>
                <h2 id="victoryWinnerName" class="winner-headline">Red Wins!</h2>
                <p style="color:var(--text-muted);">All 4 tokens successfully completed the journey to Home!</p>
                <div id="victoryStats" style="display:flex; justify-content:center; gap:1.5rem; margin-top:0.5rem; color:var(--text-main);"></div>
                <button class="btn-pill btn-primary btn-modal-cancel" style="margin-top:1.5rem; padding:0.75rem 2rem; font-size:1.1rem;">
                    Play Again
                </button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/sound.js"></script>
    <script src="js/board.js"></script>
    <script src="js/ai.js"></script>
    <script src="js/game.js"></script>
    <script src="js/app.js"></script>
</body>
</html>

