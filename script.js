const grid = document.getElementById('sudoku-grid');
const dateDisplay = document.getElementById('date');
let solution = [];
let lastCheckIncorrect = false;
let dailySeed = null;

// Initialize with daily puzzle
document.addEventListener('DOMContentLoaded', () => {
  createGrid();
  generateDailyPuzzle();
  updateDateDisplay();
});

function createGrid() {
  for (let i = 0; i < 81; i++) {
    const input = document.createElement('input');
    input.setAttribute('maxlength', '1');
    input.type = 'text';
    input.dataset.index = i;

    input.addEventListener('input', (e) => {
    const index = parseInt(e.target.dataset.index);
    const oldValue = e.target.getAttribute('data-prev-value') || '';
    const newValue = e.target.value;

    if (/^[1-9]$/.test(newValue)) {
    addToHistory(index, oldValue, newValue);
    e.target.setAttribute('data-prev-value', newValue);
    } else {
    e.target.value = '';
    }

    if (lastCheckIncorrect) {
    e.target.style.border = '1px solid #ccc';
    }
    });

    input.addEventListener('focus', (e) => {
        e.target.style.background = '#e6f7ff';
    });
    input.addEventListener('blur', (e) => {
        if (!e.target.readOnly) {
        e.target.style.background = 'white';
        }
    });
    grid.appendChild(input);
    }
}

function getDailySeed() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
    }
    return hash;
}

function createSolvedBoard(seed) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffledNumbers = [...numbers].sort((a, b) => {
    return (seed * a) % 9 - (seed * b) % 9;
  });
  
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = (row * 3 + Math.floor(row / 3) + col) % 9 + 1;
      board[row][col] = shuffledNumbers[value - 1];
    }
  }
  
  return board;
}

function removeCells(board, emptyCount = 45) {
  const puzzle = board.map(row => [...row]);
  let count = 0;
  
  const blockIndices = [0, 3, 6];
  
  for (let blockRow of blockIndices) {
    for (let blockCol of blockIndices) {
      const emptyPositions = [];
      
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          emptyPositions.push([blockRow + r, blockCol + c]);
        }
      }
      
      const toEmpty = Math.max(1, Math.floor(Math.random() * 3) + 1);
      shuffleArray(emptyPositions);
      
      for (let i = 0; i < toEmpty; i++) {
        const [row, col] = emptyPositions[i];
        puzzle[row][col] = 0;
        count++;
      }
    }
  }
  
  while (count < emptyCount) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    
    if (puzzle[row][col] !== 0) {
      const blockRow = Math.floor(row / 3) * 3;
      const blockCol = Math.floor(col / 3) * 3;
      let emptyInBlock = 0;
      
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (puzzle[blockRow + r][blockCol + c] === 0) {
            emptyInBlock++;
          }
        }
      }
      
      if (emptyInBlock < 6) {
        puzzle[row][col] = 0;
        count++;
      }
    }
  }
  
  return puzzle;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadPuzzle(puzzle) {
  const inputs = document.querySelectorAll('#sudoku-grid input');

  for (let i = 0; i < 81; i++) {
    let row = Math.floor(i / 9);
    let col = i % 9;
    const input = inputs[i];

    if (puzzle[row][col] === 0) {
      input.value = '';
      input.readOnly = false;
      input.style.background = 'white';
      input.style.cursor = 'text';
    } else {
      input.value = puzzle[row][col];
      input.readOnly = true;
      input.style.background = '#f0f0f0';
      input.style.cursor = 'default';
    }
    input.style.border = '1px solid #ccc';
  }
  lastCheckIncorrect = false;
}

function generateDailyPuzzle() {
  const todaySeed = getDailySeed();
  
  if (!dailySeed || dailySeed !== todaySeed) {
    dailySeed = todaySeed;
    const seed = hashString(todaySeed);
    const solvedBoard = createSolvedBoard(seed);
    const puzzle = removeCells(solvedBoard);
    solution = solvedBoard;
    loadPuzzle(puzzle);
    
    localStorage.setItem('dailySudoku', JSON.stringify({
      date: todaySeed,
      puzzle: puzzle,
      solution: solution
    }));
  } else {
    const saved = JSON.parse(localStorage.getItem('dailySudoku'));
    if (saved && saved.date === todaySeed) {
      solution = saved.solution;
      loadPuzzle(saved.puzzle);
    }
  }
}

function updateDateDisplay() {
  const today = new Date();
  dateDisplay.textContent = today.toDateString();
  
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0
  );
  const msUntilMidnight = midnight - now;
  
  setTimeout(() => {
    generateDailyPuzzle();
    updateDateDisplay();
    setInterval(() => {
      generateDailyPuzzle();
      updateDateDisplay();
    }, 86400000);
  }, msUntilMidnight);
}

function checkSudoku() {
  const inputs = document.querySelectorAll('#sudoku-grid input');
  let correct = true;

  inputs.forEach((input, i) => {
    const value = parseInt(input.value) || 0;
    const row = Math.floor(i / 9);
    const col = i % 9;

    if (value !== solution[row][col]) {
      input.style.border = '2px solid red';
      correct = false;
    } else {
      input.style.border = '1px solid #ccc';
    }
  });

  lastCheckIncorrect = !correct;
  alert(correct ? '🎉 Sudoku Solved!' : '❌ Incorrect. Try Again!');
}

let moveHistory = [];


function addToHistory(index, oldValue, newValue) {
  moveHistory.push({
    index: index,
    oldValue: oldValue,
    newValue: newValue
  });
}

function undoMove() {
  if (moveHistory.length === 0) return;
  
  const lastMove = moveHistory.pop();
  const input = document.querySelector(`input[data-index="${lastMove.index}"]`);
  
  if (input && !input.readOnly) {
    input.value = lastMove.oldValue;
    input.setAttribute('data-prev-value', lastMove.oldValue);
    input.style.border = '1px solid #ccc';
  }
}

function loadPuzzle(puzzle) {
  const inputs = document.querySelectorAll('#sudoku-grid input');
  moveHistory = []; // Clear history when loading new puzzle

  for (let i = 0; i < 81; i++) {
    let row = Math.floor(i / 9);
    let col = i % 9;
    const input = inputs[i];

    if (puzzle[row][col] === 0) {
      input.value = '';
      input.readOnly = false;
      input.style.background = 'white';
      input.style.cursor = 'text';
      input.setAttribute('data-prev-value', '');
    } else {
      input.value = puzzle[row][col];
      input.readOnly = true;
      input.style.background = '#f0f0f0';
      input.style.cursor = 'default';
    }
    input.style.border = '1px solid #ccc';
  }
  lastCheckIncorrect = false;
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    undoMove();
  }
});
