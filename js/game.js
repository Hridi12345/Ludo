/**
 * Ludo Game Logic & State Management
 */

class LudoGame {
    constructor(options = {}) {
        this.options = Object.assign({
            botDelay: 700,
            animationStepDelay: 140
        }, options);

        this.playersConfig = [
            { color: 'red', name: 'Red', type: 'human' },
            { color: 'green', name: 'Green', type: 'bot' },
            { color: 'yellow', name: 'Yellow', type: 'bot' },
            { color: 'blue', name: 'Blue', type: 'bot' }
        ];

        this.tokens = {
            red: [{ id: 0, step: -1 }, { id: 1, step: -1 }, { id: 2, step: -1 }, { id: 3, step: -1 }],
            green: [{ id: 0, step: -1 }, { id: 1, step: -1 }, { id: 2, step: -1 }, { id: 3, step: -1 }],
            yellow: [{ id: 0, step: -1 }, { id: 1, step: -1 }, { id: 2, step: -1 }, { id: 3, step: -1 }],
            blue: [{ id: 0, step: -1 }, { id: 1, step: -1 }, { id: 2, step: -1 }, { id: 3, step: -1 }]
        };

        this.currentTurnIdx = 0;
        this.diceValue = null;
        this.hasRolled = false;
        this.isRolling = false;
        this.isMoving = false;
        this.consecutiveSixes = 0;
        this.gameStatus = 'idle'; // 'idle' | 'playing' | 'ended'
        this.winners = []; // Array of finished player colors in order
        this.stats = { turnsCount: 0, totalCaptures: 0, startTime: null };

        // Event hooks
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => {
                try { cb(...args); } catch (e) { console.error(`Error in event ${event}:`, e); }
            });
        }
    }

    get activePlayers() {
        return this.playersConfig.filter(p => p.type !== 'inactive');
    }

    get currentPlayer() {
        const active = this.activePlayers;
        if (active.length === 0) return null;
        return active[this.currentTurnIdx % active.length];
    }

    /**
     * Start a new game with the specified player configurations
     * @param {Array} players - [{ color: 'red', name: 'Player 1', type: 'human'|'bot'|'inactive' }, ...]
     */
    start(players) {
        if (players && players.length >= 2) {
            this.playersConfig = players;
        }

        // Reset tokens
        ['red', 'green', 'yellow', 'blue'].forEach(color => {
            this.tokens[color] = [
                { id: 0, step: -1 },
                { id: 1, step: -1 },
                { id: 2, step: -1 },
                { id: 3, step: -1 }
            ];
        });

        this.currentTurnIdx = 0;
        this.diceValue = null;
        this.hasRolled = false;
        this.isRolling = false;
        this.isMoving = false;
        this.consecutiveSixes = 0;
        this.winners = [];
        this.gameStatus = 'playing';
        this.stats = { turnsCount: 0, totalCaptures: 0, startTime: Date.now() };

        this.emit('start', this.getState());
        this.emit('turnChange', this.currentPlayer, null);

        // Check if starting player is a bot
        this.checkBotTurn();
    }

    /**
     * Roll the dice for the current player
     * @param {number|null} forcedValue Optional forced value (used for room sync)
     */
    async rollDice(forcedValue = null) {
        if (this.gameStatus !== 'playing') return null;
        if (this.hasRolled || this.isRolling || this.isMoving) return null;

        this.isRolling = true;
        const player = this.currentPlayer;

        const rollVal = (forcedValue >= 1 && forcedValue <= 6)
            ? forcedValue
            : Math.floor(Math.random() * 6) + 1;

        this.emit('diceRollStart', player);

        // Simulated rolling duration
        await new Promise(r => setTimeout(r, 450));

        this.diceValue = rollVal;
        this.hasRolled = true;
        this.isRolling = false;
        this.stats.turnsCount++;

        if (rollVal === 6) {
            this.consecutiveSixes++;
        } else {
            this.consecutiveSixes = 0;
        }

        this.emit('diceRolled', player, rollVal);

        // Rule check: 3 consecutive 6s
        if (this.consecutiveSixes >= 3) {
            this.emit('log', `${player.name} rolled three 6s in a row! Turn forfeited.`, 'warning');
            this.consecutiveSixes = 0;
            await new Promise(r => setTimeout(r, 800));
            this.passTurn();
            return rollVal;
        }

        // Find legal moves
        const validMoves = this.getValidMoves(player.color, rollVal);

        if (validMoves.length === 0) {
            this.emit('log', `${player.name} rolled ${rollVal} with no valid moves.`, 'neutral');
            await new Promise(r => setTimeout(r, 700));
            this.passTurn();
        } else if (player.type === 'bot') {
            // Auto-move for bot
            await new Promise(r => setTimeout(r, this.options.botDelay));
            const chosenToken = LudoAI.chooseMove(this, player.color, rollVal, validMoves);
            if (chosenToken !== null) {
                await this.moveToken(player.color, chosenToken);
            } else {
                this.passTurn();
            }
        } else {
            // Human player: emit valid moves so UI can highlight interactive tokens
            this.emit('validMoves', player, validMoves, rollVal);

            // Optional auto-move if only 1 move is possible and it's out of base or single piece
            if (validMoves.length === 1 && this.options.autoMoveSingle) {
                await new Promise(r => setTimeout(r, 300));
                await this.moveToken(player.color, validMoves[0]);
            }
        }

        return rollVal;
    }

    /**
     * Check which tokens can legally move with the current roll
     */
    getValidMoves(color, roll) {
        if (!roll) return [];
        const valid = [];
        const tokens = this.tokens[color];

        tokens.forEach((t, idx) => {
            if (t.step === 56) {
                // Already at Home
                return;
            }
            if (t.step === -1) {
                // In Yard: only roll of 6 can move out
                if (roll === 6) valid.push(idx);
            } else {
                // On track or home stretch
                if (t.step + roll <= 56) {
                    valid.push(idx);
                }
            }
        });

        return valid;
    }

    /**
     * Move a token step by step with animations and capture checks
     */
    async moveToken(color, tokenIndex) {
        if (this.gameStatus !== 'playing') return false;
        if (!this.hasRolled || this.isMoving) return false;
        if (this.currentPlayer.color !== color) return false;

        const roll = this.diceValue;
        const validMoves = this.getValidMoves(color, roll);
        if (!validMoves.includes(tokenIndex)) return false;

        this.isMoving = true;
        const token = this.tokens[color][tokenIndex];
        const player = this.currentPlayer;
        const startStep = token.step;
        let grantBonusTurn = false;

        if (startStep === -1) {
            // Deploy from Yard to Start Cell (step 0)
            token.step = 0;
            this.emit('tokenStep', color, tokenIndex, -1, 0);
            this.emit('log', `${player.name} moved a token out of the yard!`, 'info');
            await new Promise(r => setTimeout(r, this.options.animationStepDelay * 2));
        } else {
            // Step-by-step movement
            const targetStep = startStep + roll;
            for (let step = startStep + 1; step <= targetStep; step++) {
                token.step = step;
                this.emit('tokenStep', color, tokenIndex, step - 1, step);
                await new Promise(r => setTimeout(r, this.options.animationStepDelay));
            }
        }

        // Check if reached Home
        if (token.step === 56) {
            this.emit('tokenHome', player, tokenIndex);
            this.emit('log', `🎉 ${player.name}'s token reached Home!`, 'success');
            grantBonusTurn = true;

            // Check if player completed all 4 tokens
            if (this.hasPlayerWon(color)) {
                if (!this.winners.includes(color)) {
                    this.winners.push(color);
                    player.finishedRank = this.winners.length;
                    this.emit('playerFinished', player, this.winners.length);
                    this.emit('log', `🏆 ${player.name} finished in Rank #${player.finishedRank}!`, 'success');
                }

                // Check game over condition
                const remaining = this.activePlayers.filter(p => !this.winners.includes(p.color));
                if (remaining.length <= 1) {
                    if (remaining.length === 1) {
                        this.winners.push(remaining[0].color);
                        remaining[0].finishedRank = this.winners.length;
                    }
                    this.endGame();
                    this.isMoving = false;
                    return true;
                }
            }
        } else if (token.step >= 0 && token.step <= 50) {
            // Check capture on outer track
            const currentTrackIdx = LudoBoardConfig.getTrackIndex(color, token.step);
            const isSafe = LudoBoardConfig.SAFE_TRACK_INDICES.includes(currentTrackIdx);

            if (!isSafe) {
                const captured = this.checkCapture(color, currentTrackIdx);
                if (captured.length > 0) {
                    grantBonusTurn = true;
                    this.stats.totalCaptures += captured.length;
                    captured.forEach(c => {
                        this.emit('tokenCaptured', player, c.victim, c.tokenIndex);
                        this.emit('log', `💥 ${player.name} captured ${c.victim.name}'s token!`, 'capture');
                    });
                    await new Promise(r => setTimeout(r, 350));
                }
            }
        }

        // Rule: Rolling 6 also grants an extra turn
        if (roll === 6) {
            grantBonusTurn = true;
            this.emit('log', `${player.name} rolled a 6 and earned a bonus turn!`, 'info');
        }

        this.isMoving = false;
        this.hasRolled = false;
        this.diceValue = null;

        // Advance or continue turn
        if (grantBonusTurn && !this.winners.includes(player.color)) {
            this.emit('bonusTurn', player);
            this.checkBotTurn();
        } else {
            this.passTurn();
        }

        return true;
    }

    /**
     * Check and execute capture on an unprotected track square
     */
    checkCapture(attackerColor, trackIndex) {
        const captured = [];
        for (const player of this.activePlayers) {
            if (player.color === attackerColor) continue;
            const enemyTokens = this.tokens[player.color];
            enemyTokens.forEach((t, idx) => {
                if (t.step >= 0 && t.step <= 50) {
                    const eTrack = LudoBoardConfig.getTrackIndex(player.color, t.step);
                    if (eTrack === trackIndex) {
                        t.step = -1; // Send back to base!
                        captured.push({ victim: player, tokenIndex: idx });
                    }
                }
            });
        }
        return captured;
    }

    /**
     * Check if all 4 tokens of a player have reached Home (step 56)
     */
    hasPlayerWon(color) {
        return this.tokens[color].every(t => t.step === 56);
    }

    /**
     * Pass turn to the next non-finished active player
     */
    passTurn() {
        if (this.gameStatus !== 'playing') return;

        this.hasRolled = false;
        this.isRolling = false;
        this.isMoving = false;
        this.diceValue = null;

        const prevPlayer = this.currentPlayer;
        const active = this.activePlayers;
        if (active.length === 0) return;

        // Find next player who is NOT yet finished
        let attempts = 0;
        do {
            this.currentTurnIdx = (this.currentTurnIdx + 1) % active.length;
            attempts++;
        } while (this.winners.includes(this.currentPlayer.color) && attempts <= active.length);

        if (attempts > active.length) {
            this.endGame();
            return;
        }

        this.emit('turnChange', this.currentPlayer, prevPlayer);
        this.checkBotTurn();
    }

    /**
     * If the current player is a bot, trigger auto-roll
     */
    checkBotTurn() {
        if (this.gameStatus !== 'playing') return;
        const player = this.currentPlayer;
        if (!player || player.type !== 'bot') return;

        setTimeout(() => {
            if (this.gameStatus === 'playing' && this.currentPlayer === player && !this.hasRolled) {
                this.rollDice();
            }
        }, this.options.botDelay);
    }

    endGame() {
        this.gameStatus = 'ended';
        this.emit('gameEnded', this.winners, this.stats);
    }

    /**
     * Export complete state for saving or syncing over network
     */
    getState() {
        return {
            gameStatus: this.gameStatus,
            players: this.playersConfig,
            tokens: this.tokens,
            currentTurnIdx: this.currentTurnIdx,
            diceValue: this.diceValue,
            hasRolled: this.hasRolled,
            consecutiveSixes: this.consecutiveSixes,
            winners: this.winners,
            stats: this.stats
        };
    }

    /**
     * Load state from external source (e.g. PHP backend sync)
     */
    loadState(state) {
        if (!state) return;
        this.gameStatus = state.gameStatus || this.gameStatus;
        if (state.players) this.playersConfig = state.players;
        if (state.tokens) this.tokens = state.tokens;
        if (state.currentTurnIdx !== undefined) this.currentTurnIdx = state.currentTurnIdx;
        this.diceValue = state.diceValue !== undefined ? state.diceValue : null;
        this.hasRolled = state.hasRolled !== undefined ? state.hasRolled : false;
        this.consecutiveSixes = state.consecutiveSixes || 0;
        this.winners = state.winners || [];
        this.stats = state.stats || this.stats;

        this.emit('stateLoaded', this.getState());
    }
}

window.LudoGame = LudoGame;

