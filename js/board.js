/**
 * Ludo Board Coordinate Definitions and Utilities
 * 15x15 standard grid with continuous track and home stretches
 */

const LudoBoardConfig = {
    GRID_SIZE: 15,

    // 52 common outer track cells in clockwise order starting from Red Start (r:6, c:1)
    TRACK_COORDS: [
        { r: 6, c: 1 },  // 0  - Red Start
        { r: 6, c: 2 },  // 1
        { r: 6, c: 3 },  // 2
        { r: 6, c: 4 },  // 3
        { r: 6, c: 5 },  // 4
        { r: 5, c: 6 },  // 5
        { r: 4, c: 6 },  // 6
        { r: 3, c: 6 },  // 7
        { r: 2, c: 6 },  // 8  - Star Safe Spot
        { r: 1, c: 6 },  // 9
        { r: 0, c: 6 },  // 10
        { r: 0, c: 7 },  // 11 - Top Divider (Green turn-in)
        { r: 0, c: 8 },  // 12
        { r: 1, c: 8 },  // 13 - Green Start
        { r: 2, c: 8 },  // 14
        { r: 3, c: 8 },  // 15
        { r: 4, c: 8 },  // 16
        { r: 5, c: 8 },  // 17
        { r: 6, c: 9 },  // 18
        { r: 6, c: 10 }, // 19
        { r: 6, c: 11 }, // 20
        { r: 6, c: 12 }, // 21 - Star Safe Spot
        { r: 6, c: 13 }, // 22
        { r: 6, c: 14 }, // 23
        { r: 7, c: 14 }, // 24 - Right Divider (Yellow turn-in)
        { r: 8, c: 14 }, // 25
        { r: 8, c: 13 }, // 26 - Yellow Start
        { r: 8, c: 12 }, // 27
        { r: 8, c: 11 }, // 28
        { r: 8, c: 10 }, // 29
        { r: 8, c: 9 },  // 30
        { r: 9, c: 8 },  // 31
        { r: 10, c: 8 }, // 32
        { r: 11, c: 8 }, // 33
        { r: 12, c: 8 }, // 34 - Star Safe Spot
        { r: 13, c: 8 }, // 35
        { r: 14, c: 8 }, // 36
        { r: 14, c: 7 }, // 37 - Bottom Divider (Blue turn-in)
        { r: 14, c: 6 }, // 38
        { r: 13, c: 6 }, // 39 - Blue Start
        { r: 12, c: 6 }, // 40
        { r: 11, c: 6 }, // 41
        { r: 10, c: 6 }, // 42
        { r: 9, c: 6 },  // 43
        { r: 8, c: 5 },  // 44
        { r: 8, c: 4 },  // 45
        { r: 8, c: 3 },  // 46
        { r: 8, c: 2 },  // 47 - Star Safe Spot
        { r: 8, c: 1 },  // 48
        { r: 8, c: 0 },  // 49
        { r: 7, c: 0 },  // 50 - Left Divider (Red turn-in)
        { r: 6, c: 0 }   // 51
    ],

    // Safe track indices where tokens cannot be captured
    SAFE_TRACK_INDICES: [0, 8, 13, 21, 26, 34, 39, 47],

    PLAYERS: {
        red: {
            name: 'Red',
            color: '#e74c3c',
            startTrackIndex: 0,
            baseCoords: [
                { r: 1.6, c: 1.6 },
                { r: 1.6, c: 3.4 },
                { r: 3.4, c: 1.6 },
                { r: 3.4, c: 3.4 }
            ],
            homeStretch: [
                { r: 7, c: 1 },
                { r: 7, c: 2 },
                { r: 7, c: 3 },
                { r: 7, c: 4 },
                { r: 7, c: 5 }
            ],
            homeCoord: { r: 7, c: 6.2 }
        },
        green: {
            name: 'Green',
            color: '#27ae60',
            startTrackIndex: 13,
            baseCoords: [
                { r: 1.6, c: 10.6 },
                { r: 1.6, c: 12.4 },
                { r: 3.4, c: 10.6 },
                { r: 3.4, c: 12.4 }
            ],
            homeStretch: [
                { r: 1, c: 7 },
                { r: 2, c: 7 },
                { r: 3, c: 7 },
                { r: 4, c: 7 },
                { r: 5, c: 7 }
            ],
            homeCoord: { r: 6.2, c: 7 }
        },
        yellow: {
            name: 'Yellow',
            color: '#f39c12',
            startTrackIndex: 26,
            baseCoords: [
                { r: 10.6, c: 10.6 },
                { r: 10.6, c: 12.4 },
                { r: 12.4, c: 10.6 },
                { r: 12.4, c: 12.4 }
            ],
            homeStretch: [
                { r: 7, c: 13 },
                { r: 7, c: 12 },
                { r: 7, c: 11 },
                { r: 7, c: 10 },
                { r: 7, c: 9 }
            ],
            homeCoord: { r: 7, c: 7.8 }
        },
        blue: {
            name: 'Blue',
            color: '#2980b9',
            startTrackIndex: 39,
            baseCoords: [
                { r: 10.6, c: 1.6 },
                { r: 10.6, c: 3.4 },
                { r: 12.4, c: 1.6 },
                { r: 12.4, c: 3.4 }
            ],
            homeStretch: [
                { r: 13, c: 7 },
                { r: 12, c: 7 },
                { r: 11, c: 7 },
                { r: 10, c: 7 },
                { r: 9, c: 7 }
            ],
            homeCoord: { r: 7.8, c: 7 }
        }
    },

    // Total steps from Yard to Home:
    // -1 = Yard (Base)
    // 0 = Start cell on track
    // 0..50 = Common track (51 steps)
    // 51..55 = Home stretch (5 steps)
    // 56 = Home (Finished)
    TOTAL_STEPS_TO_HOME: 56,

    /**
     * Get exact board coordinates (row, col) for a given player and relative step
     */
    getCoordinates(playerColor, step, tokenIndex = 0) {
        const p = this.PLAYERS[playerColor];
        if (!p) return { r: 0, c: 0 };

        if (step === -1) {
            // In Yard
            return p.baseCoords[tokenIndex % 4];
        }

        if (step >= 0 && step <= 50) {
            // On outer common track
            const trackIdx = (p.startTrackIndex + step) % 52;
            return this.TRACK_COORDS[trackIdx];
        }

        if (step >= 51 && step <= 55) {
            // In home stretch
            const stretchIdx = step - 51;
            return p.homeStretch[stretchIdx];
        }

        // At home (step 56)
        return p.homeCoord;
    },

    /**
     * Get track index (0..51) if the token is on the common track, or null
     */
    getTrackIndex(playerColor, step) {
        if (step >= 0 && step <= 50) {
            const p = this.PLAYERS[playerColor];
            return (p.startTrackIndex + step) % 52;
        }
        return null;
    },

    /**
     * Check if a step corresponds to a safe square
     */
    isSafeStep(playerColor, step) {
        if (step === -1) return true; // Safe in yard
        if (step >= 51) return true;  // Safe in home stretch and home
        const trackIdx = this.getTrackIndex(playerColor, step);
        return trackIdx !== null && this.SAFE_TRACK_INDICES.includes(trackIdx);
    }
};

window.LudoBoardConfig = LudoBoardConfig;

