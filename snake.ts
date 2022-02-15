/**
 * -1 for target, 0 for empty, positive integer for a snake segment that will
 * expire in that many turns
 */
type CellValue = number;

type GameBoard = CellValue[][];

enum Direction {
	North = 'n',
	South = 's',
	East = 'e',
	West = 'w',
}

interface CellCoordinate {
	row: number;
	column: number;
}

interface Game {
	/** Complete game board state */
	board: GameBoard;
	/** Length of the snake including the head */
	length: number;
}

/**
 * Generates a random integer between 0 inclusive and the given number
 * exclusive.
 */
function randomIndex (length: number) {
	return Math.floor(Math.random() * length);
}

/**
 * Picks a random empty cell in the game state and overwrites it with
 * the given value
 */
function placeRandomly (game: Game, value: CellValue): void {
	const row = game.board[randomIndex(game.board.length)];
	let columnIndex = randomIndex(row.length);
	if (row[columnIndex] === 0) {
		row[columnIndex] = value;
		return;
	}
	// TODO: this will be slow, but tail calls shouldn't be terrible?
	return placeRandomly(game, value);
}

/** Find the index of the array whose value satisfies a peredicate. */
function findIndex <T> (array: Array<T>, peredicate: (val: T, i: number) => boolean) {
	for (let i = 0; i < array.length; i += 1) {
		if (peredicate(array[i], i)) {
			return i;
		}
	}
	return -1;
}

// Main important stuff

let game: Game;

/** Reset the board to an initial state with given size. */
function init (width: number, height = width) {
	// Make a new game
	game = {
		board: [],
		length: 1,
	};

	// Initialize the board
	for (let i = 0; i < height; i += 1) {
		const row: CellValue[] = [];
		for (let j = 0; j < width; j += 1) {
			row.push(0);
		}
		game.board.push(row);
	}

	// Generate a random snake position and a random target position
	placeRandomly(game, game.length);
	placeRandomly(game, -1);
}

/** Advance the game state by one move in the given direction. */
function advance (game: Game, direction: Direction) {
	// Search for the position of the head of the snake
	let headColumn: number;
	let headRow = findIndex(game.board, row => {
		headColumn = findIndex(row, cell => cell === game.length);
		return headColumn !== -1;
	});

	// Find the new position for the head of the snake
	let newHeadRow = headRow;
	let newHeadColumn = headColumn!; // I'm probably being too clever above
	if (direction === Direction.North) {
		newHeadRow -= 1;
	} else if (direction === Direction.South) {
		newHeadRow += 1
	} else if (direction === Direction.East) {
		newHeadColumn += 1;
	} else {
		newHeadColumn -= 1;
	}

	// Check if we hit a wall
	if (newHeadRow < 0 || newHeadColumn < 0 || newHeadRow >= game.board.length || newHeadColumn >= game.board[0].length) {
		throw new Error('Would hit wall');
	}

	// Check if we hit our tail
	// FUTURE: check for 1 instead of 0 since it's fine to move into a tail cell that
	// will become empty this turn, but also must be at least 2 more than length
	// to prevent shenanigans when the snake is 2 long
	if (game.board[newHeadRow][newHeadColumn] > 0) {
		throw new Error('Would hit tail');
	}

	// Check if we hit the target
	if (game.board[newHeadRow][newHeadColumn] === -1) {
		// this is hard to explain
		game.length += 1;
		game.board[newHeadRow][newHeadColumn] = game.length;
		placeRandomly(game, -1);
		// return before the values for the rest of the tail update
		return;
	}

	// Tick down all the body segments
	for (let i = 0; i < game.board.length; i += 1) {
		for (let j = 0; j < game.board[i].length; j += 1) {
			if (game.board[i][j] > 0) {
				game.board[i][j] -= 1;
			}
		}
	}

	// Move the head forward, then remove the end of the tail (i.e. the
	// piece of the tail)
	game.board[newHeadRow][newHeadColumn] = game.length;
}

const boardEl = document.getElementById('board')!;

function render (g: Game) {
	let str = '';
	g.board.forEach((row, rowIndex) => {
		let rowEl = boardEl.childNodes[rowIndex];
		if (str) {
			str += '\n';
		}

		row.forEach((val, colIndex) => {
			str += val  === -1 ? '*' : val ? '#' : ' ';
			(rowEl.childNodes[colIndex] as HTMLElement).setAttribute('class',
				val === -1 ? 'target' : val ? 'snake' : 'empty'
			)
		});
	});
	console.log(str);
}

function advanceDisplay (direction: Direction) {
	advance(game, direction);
	render(game);
}

function initDisplay (width: number, height = width) {
	boardEl.innerHTML = '';
	for (let row = 0; row < height; row += 1) {
		const rowEl = document.createElement('div');
		rowEl.classList.add('row');
		for (let column = 0; column < width; column += 1) {
			const cell = document.createElement('div');
			cell.classList.add('cell');
			rowEl.append(cell);
		}
		boardEl.append(rowEl);
	}

	init(width, height);
	render(game);
}

document.addEventListener('keydown', event => {
	let direction: Direction;
	if (event.key === 'ArrowUp') {
		direction = Direction.North;
	} else if (event.key === 'ArrowDown') {
		direction = Direction.South;
	} else if (event.key === 'ArrowRight') {
		direction = Direction.East;
	} else if (event.key === 'ArrowLeft') {
		direction = Direction.West;
	} else {
		return;
	}

	advanceDisplay(direction);
});
