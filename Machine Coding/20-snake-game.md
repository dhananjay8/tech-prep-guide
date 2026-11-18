# Build a Snake Game

## Requirements
- Snake moves on grid, grows when eating food
- Game over on wall collision or self-collision
- Score tracking, speed increases with score
- Arrow keys for direction control

## Implementation

```javascript
import { useCallback, useEffect, useState } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 200;

function SnakeGame() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState({ x: 1, y: 0 }); // moving right
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // Choose from free cells so a full board cannot cause an endless random loop.
  const placeFood = useCallback((occupiedSnake) => {
    const occupied = new Set(occupiedSnake.map(cell => `${cell.x},${cell.y}`));
    const freeCells = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        if (!occupied.has(`${x},${y}`)) freeCells.push({ x, y });
      }
    }
    if (!freeCells.length) {
      setGameOver(true); // A full board is a win.
      return;
    }
    setFood(freeCells[Math.floor(Math.random() * freeCells.length)]);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKey = (e) => {
      const key = e.key;
      if (key === 'ArrowUp' && direction.y === 0)    setDirection({ x: 0, y: -1 });
      if (key === 'ArrowDown' && direction.y === 0)   setDirection({ x: 0, y: 1 });
      if (key === 'ArrowLeft' && direction.x === 0)   setDirection({ x: -1, y: 0 });
      if (key === 'ArrowRight' && direction.x === 0)  setDirection({ x: 1, y: 0 });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [direction]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setSnake(prev => {
        const head = { x: prev[0].x + direction.x, y: prev[0].y + direction.y };

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true); return prev;
        }
        const eatsFood = head.x === food.x && head.y === food.y;
        // The tail vacates its cell on a normal move, so it is not a collision target.
        const bodyToCheck = eatsFood ? prev : prev.slice(0, -1);
        if (bodyToCheck.some(s => s.x === head.x && s.y === head.y)) {
          setGameOver(true); return prev;
        }

        const newSnake = [head, ...prev];
        // Eat food
        if (eatsFood) {
          setScore(s => s + 1);
          placeFood(newSnake);
        } else {
          newSnake.pop(); // remove tail if no food eaten
        }
        return newSnake;
      });
    }, Math.max(50, INITIAL_SPEED - score * 5)); // speed up with score

    return () => clearInterval(timer);
  }, [direction, food, gameOver, score, placeFood]);

  return (
    <div>
      <h2>Score: {score} {gameOver && '- GAME OVER!'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)` }}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
          const x = i % GRID_SIZE, y = Math.floor(i / GRID_SIZE);
          const isSnake = snake.some(s => s.x === x && s.y === y);
          const isFood = food.x === x && food.y === y;
          return <div key={i} style={{
            width: CELL_SIZE, height: CELL_SIZE,
            background: isSnake ? '#22c55e' : isFood ? '#ef4444' : '#1e293b',
            border: '1px solid #334155'
          }} />;
        })}
      </div>
    </div>
  );
}
```

## Key Patterns
- **Game loop** with setInterval (speed adjusts with score)
- **State**: snake as array of {x,y}, head at index 0
- **Direction guard**: prevent 180° turn (can't go left if going right)
- **Collision detection**: check head against walls and body
- **Food placement**: random position not overlapping snake
- Allow moving into the current tail cell when the tail moves away on that tick.
- Handle a full-board win without looping forever while searching for a free food cell.

## Interview Tips
- Start with data structures (snake array, direction vector)
- Game loop with cleanup (clearInterval)
- Keep the game transition pure in a reducer in production; avoid setting unrelated state from inside a state updater.
- Mention: requestAnimationFrame for smoother animation in production
- Bonus features: pause, high score, grid wrap-around mode
