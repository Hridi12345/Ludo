# 🎲 Ludo Royal

A modern, responsive, feature-packed Ludo board game built with **HTML5, CSS3, JavaScript, and PHP**.

![Ludo Board Game](https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1000&q=80)

---

## 🌟 Key Features

- **Classic Official Ludo Board & Rules**:
  - Full 15x15 standard grid with 4 color bases (Red, Green, Yellow, Blue).
  - 52-cell continuous outer circuit with dedicated 5-step home stretches and center crown.
  - 8 safe star squares where pieces cannot be knocked out.
  - Accurate rules: rolling a 6 enters a token from the yard, bonus turn on 6 / capture / home, and consecutive 3x sixes penalty.
- **Smart Computer AI (Bot)**:
  - Play solo against 1, 2, or 3 intelligent AI bots.
  - Heuristic-based bot strategy: prioritizes captures, safe squares, yard deployment, and escaping danger.
- **Polished Modern UI & Animations**:
  - Glassmorphic dark luxury gaming theme.
  - 3D animated dice with realistic pip patterns and tumble physics.
  - Interactive pulsing highlights on valid movable tokens.
  - Step-by-step hopping piece movement with smooth CSS transforms and staggered multi-token stacking badges.
  - Victory celebration screen with trophy fanfare.
- **Synthesized Audio Engine (Web Audio API)**:
  - 100% self-contained audio effects (dice rolling rattle, wooden hop taps, capture slides, home chimes, and victory fanfares).
  - Works instantly without loading external audio assets or CORS problems.
  - One-click mute/unmute button.
- **PHP Backend & REST API (`api.php`)**:
  - Room-based multiplayer matchmaking: Host creates a 4-letter room code (e.g. `7XKQ`), and friends join on different devices or browser tabs.
  - State synchronization with persistent JSON storage in `data/rooms/`.
  - Hall of Fame / Leaderboard saving player statistics (turns, captures, duration).

---

## 🚀 How to Run

### Option 1: Direct Browser Launch (Local & AI Mode)
You can directly open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari) by double-clicking it or using Live Server:
```bash
# Open in your default browser
start index.html
```
*In this mode, Pass & Play local multiplayer and AI Bots work seamlessly offline without requiring a web server.*

---

### Option 2: Running with PHP Server (Multiplayer & Hall of Fame)
If you have PHP installed (or via XAMPP, WampServer, Laragon, or PHP CLI):

1. Open PowerShell or Terminal in this folder:
   ```bash
   cd d:\Developer\test
   ```

2. Start the built-in PHP development server:
   ```bash
   php -S localhost:8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

4. You can open multiple browser windows or share your local IP to test multiplayer room joining!

---

## 📁 Project Structure

```
d:\Developer\test\
├── index.php         # Primary PHP entry with game view and server hooks
├── index.html        # Standalone HTML entry for instant offline play
├── api.php           # PHP REST API for rooms, state sync, and leaderboard
├── css/
│   └── style.css     # Complete styling (glassmorphism, 3D dice, 15x15 grid, tokens)
├── js/
│   ├── sound.js      # Web Audio API procedural sound synthesizer
│   ├── board.js      # Board coordinates, track mapping, and safe squares
│   ├── ai.js         # Heuristic AI decision engine
│   ├── game.js       # Core Ludo rules, turn engine, captures, win conditions
│   └── app.js        # UI controller, animations, event listeners & room polling
├── data/             # JSON data store
│   ├── rooms/        # Active room states
│   └── leaderboard.json
└── README.md
```

---

## 📜 Standard Ludo Rules Summary

1. **Deploying from Yard**: Roll a **6** to bring a token out to the track.
2. **Bonus Turns**: Awarded when you roll a **6**, capture an enemy token, or reach Home.
3. **Capturing**: Landing on an unprotected opponent's token sends it back to their Yard.
4. **Safe Spots**: Marked with a **★ Star**; tokens resting here are immune to capture.
5. **Exact Roll to Home**: A token must roll the exact number of steps to reach the center crown.

