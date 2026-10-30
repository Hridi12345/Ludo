/**
 * Ludo AI Bot Engine
 * Intelligent heuristic-based decision making for computer players
 */

class LudoAI {
    /**
     * Choose the best token to move among valid token indices
     * @param {Object} game - LudoGame instance
     * @param {string} color - Player color ('red', 'green', 'yellow', 'blue')
     * @param {number} roll - Current dice roll (1..6)
     * @param {Array<number>} validMoves - Array of token indices [0..3]
     * @returns {number} Selected token index
     */
    static chooseMove(game, color, roll, validMoves) {
        if (!validMoves || validMoves.length === 0) return null;
        if (validMoves.length === 1) return validMoves[0];

        let bestScore = -Infinity;
        let bestToken = validMoves[0];

        for (const tokenIdx of validMoves) {
            const score = this.evaluateMove(game, color, tokenIdx, roll);
            if (score > bestScore) {
                bestScore = score;
                bestToken = tokenIdx;
            }
        }

        return bestToken;
    }

    /**
     * Score a potential move using strategic heuristics
     */
    static evaluateMove(game, color, tokenIdx, roll) {
        const token = game.tokens[color][tokenIdx];
        const currentStep = token.step;
        let score = 0;

        // 1. Moving out of Yard onto the board
        if (currentStep === -1 && roll === 6) {
            score += 65;
            // Bonus if start square captures an opponent
            const startTrack = LudoBoardConfig.PLAYERS[color].startTrackIndex;
            if (this.canCaptureAtTrack(game, color, startTrack)) {
                score += 50;
            }
            return score;
        }

        const targetStep = currentStep + roll;

        // 2. Entering Home (step 56)
        if (targetStep === 56) {
            score += 120;
            return score;
        }

        // 3. Entering Home Stretch (steps 51..55) - safe from opponents
        if (targetStep >= 51 && currentStep < 51) {
            score += 55;
        }

        // 4. Checking Captures on common track
        if (targetStep <= 50) {
            const targetTrack = LudoBoardConfig.getTrackIndex(color, targetStep);
            const isSafe = LudoBoardConfig.SAFE_TRACK_INDICES.includes(targetTrack);

            if (!isSafe && this.canCaptureAtTrack(game, color, targetTrack)) {
                score += 100; // Capturing is top priority!
            }

            // 5. Landing on a Safe Star square
            if (isSafe) {
                score += 45;
            }

            // 6. Danger evaluation: Is destination vulnerable to opponents behind?
            if (!isSafe && this.isVulnerableAtTrack(game, color, targetTrack)) {
                score -= 25;
            }

            // 7. Escape danger: If current spot is unsafe and threatened
            if (currentStep <= 50) {
                const currentTrack = LudoBoardConfig.getTrackIndex(color, currentStep);
                const currentSafe = LudoBoardConfig.SAFE_TRACK_INDICES.includes(currentTrack);
                if (!currentSafe && this.isVulnerableAtTrack(game, color, currentTrack)) {
                    score += 40; // Escaping danger is great
                }
            }
        }

        // 8. Progress bonus: Further along track is better
        score += targetStep * 0.8;

        // Add small random noise to prevent predictable ties
        score += Math.random() * 2.0;

        return score;
    }

    /**
     * Check if landing on trackIndex captures an enemy token
     */
    static canCaptureAtTrack(game, myColor, trackIndex) {
        for (const player of game.activePlayers) {
            if (player.color === myColor) continue;
            const enemyTokens = game.tokens[player.color];
            for (const t of enemyTokens) {
                if (t.step >= 0 && t.step <= 50) {
                    const eTrack = LudoBoardConfig.getTrackIndex(player.color, t.step);
                    if (eTrack === trackIndex) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Check if a trackIndex is threatened by any opponent within 1 to 6 steps behind
     */
    static isVulnerableAtTrack(game, myColor, trackIndex) {
        for (const player of game.activePlayers) {
            if (player.color === myColor) continue;
            const enemyTokens = game.tokens[player.color];
            for (const t of enemyTokens) {
                if (t.step >= 0 && t.step <= 50) {
                    const eTrack = LudoBoardConfig.getTrackIndex(player.color, t.step);
                    const dist = (trackIndex - eTrack + 52) % 52;
                    if (dist >= 1 && dist <= 6) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

window.LudoAI = LudoAI;

