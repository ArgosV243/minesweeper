import React, { useState, useEffect } from 'react';
import './App.css';

const SIZE = 10;
const NUM_MINES = 10;

const App = () => {
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [flaggedCells, setFlaggedCells] = useState([]);

  useEffect(() => {
    initializeBoard();
  }, []);

  const initializeBoard = () => {
    const cells = Array.from({ length: SIZE * SIZE }, (_, index) => index);
    const bombIndices = shuffle(cells).slice(0, NUM_MINES);

    const newBoard = Array(SIZE)
      .fill(null)
      .map((_, row) =>
        Array(SIZE).fill(null).map((_, col) => ({
          row,
          col,
          value: bombIndices.includes(row * SIZE + col) ? 'mine' : 0,
          revealed: false,
          flagged: false
        }))
      );

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (newBoard[row][col].value !== 'mine') {
          let mines = 0;

          for (let i = Math.max(0, row - 1); i <= Math.min(row + 1, SIZE - 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(col + 1, SIZE - 1); j++) {
              if (newBoard[i][j].value === 'mine') {
                mines++;
              }
            }
          }

          newBoard[row][col].value = mines;
        }
      }
    }

    setBoard(newBoard);
    setGameOver(false);
    setStartTime(null);
    setElapsedTime(0);
    setFlaggedCells([]);
  };

  const shuffle = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  const handleCellClick = (row, col) => {
    if (gameOver) return;

    const cell = board[row][col];

    if (cell.revealed) return;

    if (startTime === null) {
      setStartTime(Date.now());
    }

    const newBoard = [...board];

    if (isFlagged) {
      const isAlreadyFlagged = flaggedCells.some((cell) => cell.row === row && cell.col === col);

      if (isAlreadyFlagged) {
        setFlaggedCells(flaggedCells.filter((cell) => cell.row !== row || cell.col !== col));
      } else {
        setFlaggedCells([...flaggedCells, { row, col }]);
      }
    } else {
      if (cell.flagged) {
        newBoard[row][col].flagged = false;
        setFlaggedCells(flaggedCells.filter((cell) => cell.row !== row || cell.col !== col));
      } else {
        newBoard[row][col].revealed = true;

        if (cell.value === 'mine') {
          setGameOver(true);
          revealAllBombs();
          alert('Game over! You clicked on a mine!');
        } else if (cell.value === 0) {
          revealAllCells(row, col);
        }
      }
    }

    setBoard(newBoard);
  };

  const revealAllCells = (row, col) => {
    const newBoard = [...board];
    const queue = [[row, col]];

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const cell = newBoard[r][c];

      if (!cell.revealed) {
        newBoard[r][c].revealed = true;

        if (cell.value === 0) {
          for (let i = Math.max(0, r - 1); i <= Math.min(r + 1, SIZE - 1); i++) {
            for (let j = Math.max(0, c - 1); j <= Math.min(c + 1, SIZE - 1); j++) {
              if (!newBoard[i][j].revealed) {
                queue.push([i, j]);
              }
            }
          }
        }
      }
    }

    setBoard(newBoard);
  };

  const revealAllBombs = () => {
    const newBoard = [...board];

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = newBoard[row][col];

        if (cell.value === 'mine') {
          newBoard[row][col].revealed = true;
        }
      }
    }

    setBoard(newBoard);
  };

  const handleFlagToggle = () => {
    setIsFlagged(!isFlagged);
  };

  const handleCellRightClick = (event, row, col) => {
    event.preventDefault();
    setSelectedCell({ row, col });
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  const handleContextMenuClick = () => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      const isAlreadyFlagged = flaggedCells.some((cell) => cell.row === row && cell.col === col);

      if (isAlreadyFlagged) {
        setFlaggedCells(flaggedCells.filter((cell) => cell.row !== row || cell.col !== col));
      } else {
        setFlaggedCells([...flaggedCells, { row, col }]);
      }
    }
  };

  useEffect(() => {
    let interval = null;

    if (startTime !== null && !gameOver) {
      interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [startTime, gameOver]);

  return (
    <div
      className="App"
      onContextMenu={handleContextMenu}
      onClick={handleContextMenuClick}
    >
      <h1>Minesweeper</h1>
      <label className={`flag-box ${isFlagged ? 'selected' : ''}`}>
        <input
          type="checkbox"
          checked={isFlagged}
          onChange={handleFlagToggle}
        />
        <span role="img" aria-label="flag">🚩</span> Flag
      </label>
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => {
              const isFlaggedCell = flaggedCells.some(
                (flaggedCell) => flaggedCell.row === rowIndex && flaggedCell.col === colIndex
              );

              return (
                <div
                  key={colIndex}
                  className={`cell ${cell.revealed ? 'revealed' : ''} ${isFlaggedCell ? 'flagged' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onContextMenu={(event) => handleCellRightClick(event, rowIndex, colIndex)}
                >
                  {cell.revealed && cell.value !== 0 && cell.value !== 'mine' && cell.value}
                  {cell.revealed && cell.value === 'mine' && (
                    <span role="img" aria-label="mine">💣</span>
                  )}
                  {isFlaggedCell && !cell.revealed && (
                    <span role="img" aria-label="flag">🚩</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="timer">
        Time: {elapsedTime}s
      </div>
      <button className="reset-btn" onClick={initializeBoard}>
        Reset
      </button>
    </div>
  );
};

export default App;
