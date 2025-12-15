# Noughts and Crosses Game

A modern, feature-rich implementation of the classic Tic-Tac-Toe game with a beautiful dark/light theme interface.

## Features

### Core Gameplay
- Classic 3x3 noughts and crosses (tic-tac-toe) game
- Turn-based gameplay for two players
- Win detection for all possible winning combinations
- Draw detection when the board is full

### Score Tracking
- **Player Wins Tally**: Tracks wins for both Player 1 (X) and Player 2 (O)
- **Draws Counter**: Keeps count of tied games
- **Persistent Storage**: Scores are saved and persist across browser sessions

### Player Customization
- **Editable Player Names**: Click the pencil icon next to any player name to customize it
- Default names are "Player 1" and "Player 2"
- Names are saved in browser localStorage

### Smart Recommendations
- **10-Second Inactivity Timer**: If a player hasn't made a move in 10 seconds, the game suggests a strategic position
- Smart AI recommendations that prioritize:
  1. Winning moves
  2. Blocking opponent's winning moves
  3. Strategic positions (center, corners, edges)

### Theme Support
- **Dark Theme** (default): Easy on the eyes with purple and pink accents
- **Light Theme**: Clean, bright interface
- Toggle between themes using the sun/moon button in the header
- Theme preference saved across sessions

### Responsive Design
- Fully responsive layout that works on desktop, tablet, and mobile devices
- Touch-friendly interface
- Adaptive layout for different screen sizes

## How to Play

1. **Open the game** in your web browser
2. **Player 1 (X)** goes first
3. **Click any empty cell** to place your marker
4. **Take turns** until someone wins or the game ends in a draw
5. **Click "New Game"** to reset the board and play again
6. **Customize player names** by clicking the pencil icons
7. **Switch themes** using the theme toggle button

## Live Demo

Once GitHub Pages is enabled, your game will be available at:
`https://pegasus829.github.io/Xo-game/`

## Local Development

To run the game locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/Pegasus829/Xo-game.git
   cd Xo-game
   ```

2. Open `index.html` in your web browser, or serve it using a local server:
   ```bash
   # Using Python
   python3 -m http.server 8000

   # Using Node.js
   npx serve

   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser to `http://localhost:8000`

## Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS custom properties (variables) for theming
- **JavaScript (ES6+)**: Game logic, DOM manipulation, and localStorage
- **No dependencies**: Pure vanilla JavaScript - no frameworks or libraries needed!

## Browser Support

Works in all modern browsers that support:
- CSS Grid
- CSS Custom Properties
- ES6 JavaScript
- localStorage API

## Project Structure

```
Xo-game/
├── index.html          # Main HTML structure
├── styles.css          # Styling and themes
├── script.js           # Game logic and interactivity
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages deployment
└── README.md          # This file
```

## License

This project is open source and available for educational purposes.

## Contributing

Feel free to fork this repository and submit pull requests for any improvements!
