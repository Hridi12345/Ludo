/**
 * Ludo UI Controller, Board Renderer, and Event Orchestrator
 */

class LudoApp {
    constructor() {
        this.game = new LudoGame();
        this.boardWrapper = document.getElementById('boardWrapper');
        this.gridEl = document.getElementById('ludoGrid');
        this.tokensLayer = document.getElementById('tokensLayer');
        this.diceCube = document.getElementById('diceCube');
        this.btnRoll = document.getElementById('btnRoll');
        this.turnNameEl = document.getElementById('turnPlayerName');
        this.logContentEl = document.getElementById('logContent');

        this.tokenElements = { red: [], green: [], yellow: [], blue: [] };
        this.activeRoomId = null;
        this.assignedColor = null;
        this.clientId = 'client_' + Math.random().toString(36).substring(2, 9);
        this.pollingInterval = null;
        this.validMoveIndices = [];

        this.init();
    }

    init() {
        this.renderBoard();
        this.createTokens();
        this.setupEventListeners();
        this.setupGameHooks();

        // Start default local game
        this.startNewGame();
    }

    /**
     * Build the 15x15 Ludo board DOM structure
     */
    renderBoard() {
        this.gridEl.innerHTML = '';

        // 1. Red Base (Yard) Top-Left (row 1-6, col 1-6)
        this.gridEl.appendChild(this.createBaseQuadrant('red', 1, 7, 1, 7));

        // 2. Green Base (Yard) Top-Right (row 1-6, col 10-15)
        this.gridEl.appendChild(this.createBaseQuadrant('green', 1, 7, 10, 16));

        // 3. Yellow Base (Yard) Bottom-Right (row 10-15, col 10-15)
        this.gridEl.appendChild(this.createBaseQuadrant('yellow', 10, 16, 10, 16));

        // 4. Blue Base (Yard) Bottom-Left (row 10-15, col 1-6)
        this.gridEl.appendChild(this.createBaseQuadrant('blue', 10, 16, 1, 7));

        // 5. Center Home Triangle (rows 7-9, cols 7-9)
        const centerHome = document.createElement('div');
        centerHome.className = 'center-home-area';
        centerHome.innerHTML = `
            <div class="home-triangles">
                <div class="home-triangle left"></div>
                <div class="home-triangle top"></div>
                <div class="home-triangle right"></div>
                <div class="home-triangle bottom"></div>
            </div>
            <div class="home-center-gem">👑</div>
        `;
        this.gridEl.appendChild(centerHome);

        // 6. Generate individual track and home-stretch cells
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                // Skip corner base areas and center 3x3
                if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8) || (r >= 6 && r <= 8 && c >= 6 && c <= 8)) {
                    continue;
                }

                const cell = document.createElement('div');
                cell.className = 'cell track-cell';
                cell.style.gridRow = `${r + 1} / ${r + 2}`;
                cell.style.gridColumn = `${c + 1} / ${c + 2}`;
                cell.dataset.r = r;
                cell.dataset.c = c;

                // Mark Red Start & Home Column
                if (r === 6 && c === 1) cell.classList.add('colored-start', 'red', 'arrow-mark', 'arrow-right');
                if (r === 7 && c >= 1 && c <= 5) cell.classList.add('home-stretch', 'red');

                // Mark Green Start & Home Column
                if (r === 1 && c === 8) cell.classList.add('colored-start', 'green', 'arrow-mark', 'arrow-down');
                if (c === 7 && r >= 1 && r <= 5) cell.classList.add('home-stretch', 'green');

                // Mark Yellow Start & Home Column
                if (r === 8 && c === 13) cell.classList.add('colored-start', 'yellow', 'arrow-mark', 'arrow-left');
                if (r === 7 && c >= 9 && c <= 13) cell.classList.add('home-stretch', 'yellow');

                // Mark Blue Start & Home Column
                if (r === 13 && c === 6) cell.classList.add('colored-start', 'blue', 'arrow-mark', 'arrow-up');
                if (c === 7 && r >= 9 && r <= 13) cell.classList.add('home-stretch', 'blue');

                // Safe Star Squares (classic 8 safe cells)
                const isStar = (r === 6 && c === 1) || (r === 2 && c === 6) ||
                               (r === 1 && c === 8) || (r === 6 && c === 12) ||
                               (r === 8 && c === 13) || (r === 12 && c === 8) ||
                               (r === 13 && c === 6) || (r === 8 && c === 2);
                if (isStar) cell.classList.add('safe-star');

                this.gridEl.appendChild(cell);
            }
        }
    }

    createBaseQuadrant(color, rStart, rEnd, cStart, cEnd) {
        const quad = document.createElement('div');
        quad.className = `base-quadrant ${color}`;
        quad.style.gridRow = `${rStart} / ${rEnd}`;
        quad.style.gridColumn = `${cStart} / ${cEnd}`;

        const innerYard = document.createElement('div');
        innerYard.className = 'base-inner-yard';
        for (let i = 0; i < 4; i++) {
            const pocket = document.createElement('div');
            pocket.className = `yard-pocket ${color}`;
            innerYard.appendChild(pocket);
        }
        quad.appendChild(innerYard);
        return quad;
    }

    /**
     * Create the 16 interactive token DOM elements
     */
    createTokens() {
        this.tokensLayer.innerHTML = '';
        this.tokenElements = { red: [], green: [], yellow: [], blue: [] };

        ['red', 'green', 'yellow', 'blue'].forEach(color => {
            for (let i = 0; i < 4; i++) {
                const tokenEl = document.createElement('div');
                tokenEl.className = `ludo-token ${color}`;
                tokenEl.dataset.color = color;
                tokenEl.dataset.index = i;
                tokenEl.innerHTML = `<div class="ludo-token-inner">${i + 1}</div>`;

                tokenEl.addEventListener('click', () => {
                    this.onTokenClicked(color, i);
                });

                this.tokensLayer.appendChild(tokenEl);
                this.tokenElements[color].push(tokenEl);
            }
        });

        this.updateTokenPositions(false);
    }

    /**
     * Reposition all tokens based on game state, handling stacking on shared cells
     */
    updateTokenPositions(animate = true) {
        // Group tokens by identical position to display stacked badges
        const positionGroups = {};

        ['red', 'green', 'yellow', 'blue'].forEach(color => {
            const playerTokens = this.game.tokens[color];
            playerTokens.forEach((t, idx) => {
                const coord = LudoBoardConfig.getCoordinates(color, t.step, idx);
                const key = `${coord.r.toFixed(1)}_${coord.c.toFixed(1)}`;
                if (!positionGroups[key]) positionGroups[key] = [];
                positionGroups[key].push({ color, idx, coord, step: t.step });
            });
        });

        Object.values(positionGroups).forEach(group => {
            const count = group.length;
            group.forEach((item, i) => {
                const tokenEl = this.tokenElements[item.color][item.idx];
                if (!tokenEl) return;

                // Center position in percent
                let leftPct = ((item.coord.c + 0.5) / 15) * 100;
                let topPct = ((item.coord.r + 0.5) / 15) * 100;

                // Subtle offset if multiple tokens share the square
                if (count > 1 && item.step !== -1) {
                    const angle = (i / count) * (Math.PI * 2);
                    const offset = 1.35; // %
                    leftPct += Math.cos(angle) * offset;
                    topPct += Math.sin(angle) * offset;
                }

                tokenEl.style.left = `${leftPct}%`;
                tokenEl.style.top = `${topPct}%`;

                // Badge counter if stacked
                const existingBadge = tokenEl.querySelector('.token-stack-badge');
                if (count > 1 && item.step !== -1) {
                    if (!existingBadge) {
                        const badge = document.createElement('div');
                        badge.className = 'token-stack-badge';
                        badge.textContent = count;
                        tokenEl.appendChild(badge);
                    } else {
                        existingBadge.textContent = count;
                    }
                } else if (existingBadge) {
                    existingBadge.remove();
                }
            });
        });
    }

    /**
     * Render the 3D dice faces (pips 1-6)
     */
    renderDicePips(val) {
        this.diceCube.innerHTML = '';
        if (!val || val < 1 || val > 6) {
            // Default 1 dot
            val = 1;
        }

        // 3x3 positions for dots:
        // [1, 2, 3]
        // [4, 5, 6]
        // [7, 8, 9]
        const pipConfigs = {
            1: [5],
            2: [3, 7],
            3: [3, 5, 7],
            4: [1, 3, 7, 9],
            5: [1, 3, 5, 7, 9],
            6: [1, 3, 4, 6, 7, 9]
        };

        const activePips = pipConfigs[val] || [5];

        for (let pos = 1; pos <= 9; pos++) {
            if (activePips.includes(pos)) {
                const pip = document.createElement('div');
                pip.className = 'dice-pip';
                const row = Math.ceil(pos / 3);
                const col = ((pos - 1) % 3) + 1;
                pip.style.gridRow = row;
                pip.style.gridColumn = col;
                this.diceCube.appendChild(pip);
            }
        }
    }

    /**
     * User clicked a token
     */
    async onTokenClicked(color, tokenIndex) {
        if (!this.validMoveIndices.includes(tokenIndex)) return;
        if (this.game.currentPlayer.color !== color) return;

        // In room multiplayer, only active client's assigned color can move
        if (this.activeRoomId && this.assignedColor && this.assignedColor !== color) {
            this.showToast("It's not your player slot!", 'warning');
            return;
        }

        this.clearMovableHighlights();
        await this.game.moveToken(color, tokenIndex);

        // Sync with PHP room if connected
        if (this.activeRoomId) {
            this.syncStateToRoom();
        }
    }

    clearMovableHighlights() {
        this.validMoveIndices = [];
        document.querySelectorAll('.ludo-token.movable').forEach(el => el.classList.remove('movable'));
    }

    highlightMovableTokens(color, validIndices) {
        this.clearMovableHighlights();
        this.validMoveIndices = validIndices;
        validIndices.forEach(idx => {
            const tokenEl = this.tokenElements[color][idx];
            if (tokenEl) tokenEl.classList.add('movable');
        });
    }

    /**
     * Connect Game logic events to UI updates and Web Audio
     */
    setupGameHooks() {
        this.game.on('diceRollStart', player => {
            window.ludoAudio.playDiceRoll();
            this.diceCube.classList.add('rolling');
            this.btnRoll.disabled = true;
        });

        this.game.on('diceRolled', (player, value) => {
            this.diceCube.classList.remove('rolling');
            this.renderDicePips(value);
            this.updatePlayerCards();
        });

        this.game.on('tokenStep', (color, tokenIdx, fromStep, toStep) => {
            window.ludoAudio.playStep();
            this.updateTokenPositions(true);
            this.updatePlayerCards();
        });

        this.game.on('tokenCaptured', (attacker, victim, tokenIdx) => {
            window.ludoAudio.playCapture();
            this.updateTokenPositions(true);
            this.updatePlayerCards();
        });

        this.game.on('tokenHome', (player, tokenIdx) => {
            window.ludoAudio.playHome();
            this.updatePlayerCards();
        });

        this.game.on('validMoves', (player, validMoves, rollVal) => {
            this.highlightMovableTokens(player.color, validMoves);
        });

        this.game.on('turnChange', (newPlayer, prevPlayer) => {
            this.clearMovableHighlights();
            this.updateTurnDisplay(newPlayer);
            this.updatePlayerCards();
            window.ludoAudio.playTurnAlert();

            // Check if current user can roll
            const canRoll = this.canCurrentClientRoll(newPlayer);
            this.btnRoll.disabled = !canRoll;
        });

        this.game.on('bonusTurn', player => {
            this.clearMovableHighlights();
            this.updateTurnDisplay(player);
            const canRoll = this.canCurrentClientRoll(player);
            this.btnRoll.disabled = !canRoll;
        });

        this.game.on('gameEnded', (winners, stats) => {
            window.ludoAudio.playWin();
            this.showVictoryModal(winners, stats);

            // Record winner to PHP backend
            this.recordWinnerToBackend(winners[0], stats);
        });

        this.game.on('log', (message, type) => {
            this.logMessage(message, type);
        });
    }

    canCurrentClientRoll(player) {
        if (!player) return false;
        if (player.type === 'bot') return false;
        if (this.activeRoomId && this.assignedColor && this.assignedColor !== player.color) {
            return false;
        }
        return true;
    }

    updateTurnDisplay(player) {
        if (!player) return;
        this.turnNameEl.textContent = `${player.name}'s Turn`;
        this.turnNameEl.style.color = LudoBoardConfig.PLAYERS[player.color].color;

        // Update dice glowing accent
        this.diceCube.className = `dice-cube glow-${player.color}`;

        const dashboard = document.querySelector('.dice-dashboard');
        if (dashboard) {
            dashboard.className = `dice-dashboard ${player.color}`;
        }
    }

    updatePlayerCards() {
        ['red', 'green', 'yellow', 'blue'].forEach(color => {
            const card = document.getElementById(`playerCard_${color}`);
            if (!card) return;

            const isCurrent = this.game.currentPlayer && this.game.currentPlayer.color === color;
            card.classList.toggle('active-turn', isCurrent);

            // Update token counts
            const tokens = this.game.tokens[color];
            const inYard = tokens.filter(t => t.step === -1).length;
            const atHome = tokens.filter(t => t.step === 56).length;
            const onTrack = 4 - inYard - atHome;

            const yardEl = card.querySelector('.count-yard');
            const trackEl = card.querySelector('.count-track');
            const homeEl = card.querySelector('.count-home');

            if (yardEl) yardEl.textContent = inYard;
            if (trackEl) trackEl.textContent = onTrack;
            if (homeEl) homeEl.textContent = atHome;

            // Finished rank badge
            const p = this.game.playersConfig.find(p => p.color === color);
            const statusPill = card.querySelector('.player-status-pill');
            if (statusPill) {
                if (p && p.finishedRank) {
                    statusPill.className = 'player-status-pill rank-badge';
                    statusPill.textContent = `#${p.finishedRank} Finisher`;
                } else if (isCurrent) {
                    statusPill.className = 'player-status-pill rolling';
                    statusPill.textContent = this.game.hasRolled ? 'Moving...' : 'Rolling...';
                } else {
                    statusPill.className = 'player-status-pill';
                    statusPill.textContent = 'Waiting';
                }
            }
        });
    }

    logMessage(message, type = 'info') {
        const icons = {
            info: '🎲',
            success: '🎉',
            warning: '⚠️',
            capture: '💥',
            neutral: 'ℹ️'
        };
        const iconEl = document.querySelector('.game-log-ticker .log-icon');
        if (iconEl) iconEl.textContent = icons[type] || '🎲';
        if (this.logContentEl) this.logContentEl.textContent = message;
    }

    /**
     * Start local new game from player configs
     */
    startNewGame() {
        const configs = [
            { color: 'red', name: document.getElementById('cfgNameRed')?.value || 'Red', type: document.getElementById('cfgTypeRed')?.value || 'human' },
            { color: 'green', name: document.getElementById('cfgNameGreen')?.value || 'Green', type: document.getElementById('cfgTypeGreen')?.value || 'bot' },
            { color: 'yellow', name: document.getElementById('cfgNameYellow')?.value || 'Yellow', type: document.getElementById('cfgTypeYellow')?.value || 'bot' },
            { color: 'blue', name: document.getElementById('cfgNameBlue')?.value || 'Blue', type: document.getElementById('cfgTypeBlue')?.value || 'bot' }
        ];

        this.game.start(configs);
        this.renderDicePips(1);
        this.updateTokenPositions(false);
        this.updatePlayerCards();
        this.logMessage('New game started! Roll the dice to begin.', 'info');
    }

    setupEventListeners() {
        // Roll Button
        this.btnRoll.addEventListener('click', () => {
            if (this.canCurrentClientRoll(this.game.currentPlayer)) {
                this.game.rollDice();
                if (this.activeRoomId) this.syncStateToRoom();
            }
        });

        // Click on Dice Cube directly
        this.diceCube.addEventListener('click', () => {
            if (this.canCurrentClientRoll(this.game.currentPlayer)) {
                this.game.rollDice();
                if (this.activeRoomId) this.syncStateToRoom();
            }
        });

        // Spacebar to roll
        window.addEventListener('keydown', e => {
            if (e.code === 'Space' && !['INPUT', 'SELECT'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                if (this.canCurrentClientRoll(this.game.currentPlayer)) {
                    this.game.rollDice();
                    if (this.activeRoomId) this.syncStateToRoom();
                }
            }
        });

        // Sound Toggle Button
        const btnMute = document.getElementById('btnMute');
        if (btnMute) {
            btnMute.addEventListener('click', () => {
                const muted = window.ludoAudio.toggleMute();
                btnMute.innerHTML = muted ? '🔇' : '🔊';
                btnMute.title = muted ? 'Unmute' : 'Mute';
            });
        }

        // New Game Modal Controls
        const btnNewGame = document.getElementById('btnNewGame');
        const modalNewGame = document.getElementById('modalNewGame');
        const btnStartGameConfirm = document.getElementById('btnStartGameConfirm');

        btnNewGame?.addEventListener('click', () => this.openModal('modalNewGame'));
        btnStartGameConfirm?.addEventListener('click', () => {
            this.startNewGame();
            this.closeModal('modalNewGame');
        });

        // Room Multiplayer Controls
        const btnRoom = document.getElementById('btnRoom');
        btnRoom?.addEventListener('click', () => this.openModal('modalRoom'));

        // Leaderboard Controls
        const btnLeaderboard = document.getElementById('btnLeaderboard');
        btnLeaderboard?.addEventListener('click', () => {
            this.loadLeaderboard();
            this.openModal('modalLeaderboard');
        });

        // Rules Controls
        const btnRules = document.getElementById('btnRules');
        btnRules?.addEventListener('click', () => this.openModal('modalRules'));

        // Close Modal Buttons
        document.querySelectorAll('.btn-close-modal, .btn-modal-cancel').forEach(btn => {
            btn.addEventListener('click', e => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) modal.classList.remove('active');
            });
        });

        // Tab switches in Room Modal
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.room-tab-content').forEach(c => c.style.display = 'none');

                btn.classList.add('active');
                const target = document.getElementById(btn.dataset.tab);
                if (target) target.style.display = 'block';
            });
        });

        // API Room Handlers
        document.getElementById('btnCreateRoomSubmit')?.addEventListener('click', () => this.handleCreateRoom());
        document.getElementById('btnJoinRoomSubmit')?.addEventListener('click', () => this.handleJoinRoom());
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    }

    /**
     * PHP Multiplayer: Create Room
     */
    async handleCreateRoom() {
        const hostName = document.getElementById('roomHostName')?.value || 'Host';
        const hostColor = document.getElementById('roomHostColor')?.value || 'red';
        const playerCount = parseInt(document.getElementById('roomPlayerCount')?.value || '4');

        try {
            const res = await fetch('api.php?action=create_room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hostName,
                    hostColor,
                    playerCount,
                    clientId: this.clientId
                })
            });
            const data = await res.json();
            if (data.success) {
                this.activeRoomId = data.room.roomId;
                this.assignedColor = hostColor;
                this.closeModal('modalRoom');
                this.showToast(`Room ${this.activeRoomId} created! Assigned to ${hostColor.toUpperCase()}`, 'success');
                this.updateRoomBadge();
                this.startRoomPolling();
            } else {
                this.showToast(data.message || 'Error creating room', 'error');
            }
        } catch (err) {
            this.showToast('PHP API unreachable. Playing in local mode.', 'warning');
        }
    }

    /**
     * PHP Multiplayer: Join Room
     */
    async handleJoinRoom() {
        const roomCode = document.getElementById('joinRoomCode')?.value.trim();
        const playerName = document.getElementById('joinPlayerName')?.value.trim() || 'Player';

        if (!roomCode) {
            this.showToast('Please enter a room code', 'warning');
            return;
        }

        try {
            const res = await fetch('api.php?action=join_room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomCode,
                    playerName,
                    clientId: this.clientId
                })
            });
            const data = await res.json();
            if (data.success) {
                this.activeRoomId = roomCode.toUpperCase();
                this.assignedColor = data.assignedColor;
                this.closeModal('modalRoom');
                this.showToast(`Joined room ${this.activeRoomId} as ${this.assignedColor.toUpperCase()}!`, 'success');
                this.updateRoomBadge();
                this.startRoomPolling();
            } else {
                this.showToast(data.message || 'Error joining room', 'error');
            }
        } catch (err) {
            this.showToast('PHP API unreachable', 'error');
        }
    }

    startRoomPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(async () => {
            if (!this.activeRoomId) return;
            try {
                const res = await fetch(`api.php?action=get_room&roomId=${this.activeRoomId}`);
                const data = await res.json();
                if (data.success && data.room.gameState) {
                    // Update state if received
                    this.game.loadState(data.room.gameState);
                    this.updateTokenPositions(true);
                    this.updatePlayerCards();
                }
            } catch (e) {
                // Ignore transient polling failure
            }
        }, 2000);
    }

    async syncStateToRoom() {
        if (!this.activeRoomId) return;
        try {
            await fetch('api.php?action=update_state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: this.activeRoomId,
                    gameState: this.game.getState()
                })
            });
        } catch (e) {
            console.error('Failed to sync state to PHP backend', e);
        }
    }

    updateRoomBadge() {
        const btnRoom = document.getElementById('btnRoom');
        if (btnRoom && this.activeRoomId) {
            btnRoom.innerHTML = `<span>Room: <strong>${this.activeRoomId}</strong> (${this.assignedColor})</span>`;
            btnRoom.classList.add('btn-primary');
        }
    }

    async loadLeaderboard() {
        const tbody = document.getElementById('leaderboardList');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem;">Loading champions...</td></tr>';

        try {
            const res = await fetch('api.php?action=get_leaderboard');
            const data = await res.json();
            if (data.success && data.leaderboard.length > 0) {
                tbody.innerHTML = data.leaderboard.map((item, idx) => `
                    <tr>
                        <td><strong>#${idx + 1}</strong></td>
                        <td><span style="color:${LudoBoardConfig.PLAYERS[item.color]?.color || '#fff'}">●</span> ${item.name}</td>
                        <td>${item.turns} turns</td>
                        <td>${item.captures} captured</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted)">No recorded champions yet. Be the first to win!</td></tr>';
            }
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted)">Connect PHP server to view online leaderboard.</td></tr>';
        }
    }

    async recordWinnerToBackend(winnerColor, stats) {
        const winner = this.game.playersConfig.find(p => p.color === winnerColor);
        if (!winner) return;

        const duration = Math.round((Date.now() - (stats.startTime || Date.now())) / 1000);

        try {
            await fetch('api.php?action=record_win', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    winnerName: winner.name,
                    winnerColor: winner.color,
                    turns: stats.turnsCount,
                    captures: stats.totalCaptures,
                    duration: duration
                })
            });
        } catch (e) {
            // Standalone mode - silently skip
        }
    }

    showVictoryModal(winners, stats) {
        const winnerColor = winners[0];
        const winner = this.game.playersConfig.find(p => p.color === winnerColor);
        const modal = document.getElementById('modalVictory');
        const nameEl = document.getElementById('victoryWinnerName');
        const statsEl = document.getElementById('victoryStats');

        if (nameEl && winner) {
            nameEl.textContent = `${winner.name} Wins!`;
            nameEl.style.color = LudoBoardConfig.PLAYERS[winnerColor].color;
        }

        if (statsEl) {
            const mins = Math.floor((Date.now() - stats.startTime) / 60000);
            statsEl.innerHTML = `
                <p>Turns: <strong>${stats.turnsCount}</strong></p>
                <p>Total Captures: <strong>${stats.totalCaptures}</strong></p>
                <p>Game Time: <strong>${mins > 0 ? mins + 'm ' : ''}${Math.round(((Date.now() - stats.startTime) % 60000) / 1000)}s</strong></p>
            `;
        }

        this.openModal('modalVictory');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `ludo-toast ${type}`;
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = '#1e293b';
        toast.style.color = '#ffffff';
        toast.style.padding = '0.75rem 1.5rem';
        toast.style.borderRadius = '30px';
        toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        toast.style.zIndex = '9999';
        toast.style.fontSize = '0.9rem';
        toast.style.fontWeight = '600';
        toast.style.border = '1px solid rgba(255,255,255,0.2)';

        if (type === 'success') toast.style.borderLeft = '4px solid #10b981';
        if (type === 'error') toast.style.borderLeft = '4px solid #ef4444';
        if (type === 'warning') toast.style.borderLeft = '4px solid #f59e0b';

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    window.ludoApp = new LudoApp();
});

