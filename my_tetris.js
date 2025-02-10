// Declaring tetromino piecies
class Tetromino {
    
    constructor(shape, color){ // Initializing the tetromino shape
        this.shape = shape;
        this.color = color;
    }
    
    static allShapes(){ // Defining all tetrominos
        return {
            I: new Tetromino([[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], '#0FF0FC'),
            O: new Tetromino([[1, 1], [1, 1]], '#FFEA61'),
            T: new Tetromino([[0, 1, 0], [1, 1, 1], [0, 0, 0]], '#966FD6'),
            S: new Tetromino([[0, 1, 1], [1, 1, 0], [0, 0, 0]], '#80EF80'),
            Z: new Tetromino([[1, 1, 0], [0, 1, 1], [0, 0, 0]], '#FF746C'),
            J: new Tetromino([[1, 0, 0], [1, 1, 1], [0, 0, 0]], '#0073E6'),
            L: new Tetromino([[0, 0, 1], [1, 1, 1], [0, 0, 0]], '#FF964F')
        }; 
    }
    
    rotateClockwise(){ // Rotating tetromino clockwise
        this.shape = this.shape[0].map((_, index) => 
            this.shape.map(row => row[index]).reverse()
        );
    }

    rotateCounterclockwise(){ // Rotating tetromino counterclockwise
        this.shape = this.shape[0].map((_, index) => 
            this.shape.map(row => row[index]).reverse()
        ).reverse();
    }
}

// Declaring a gameboard
class Gameboard {

    constructor(){ // initializing board and first random tetromino batch
        this.board = Array.from( { length: 20}, () => Array(10).fill(0));
        this.colors = Array.from( { length: 20}, () => Array(10).fill(null));
        this.tetrominoBag = this.shuffleTetromino();
        this.currentTetromino = null;
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.nextTetromino = this.nextTetrominoFromBag();
    }

    shuffleTetromino(){ // creating shuffles list of tetrominos
        const shapes = Object.values(Tetromino.allShapes());
        for (let i = shapes.length - 1; i > 0; i--){ // generating random index to shuffle tetrominos in the array
            const j = Math.floor(Math.random() * (i + 1));
            [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
        }
        return shapes;
    }

    nextTetromino(){ // removing used tetrominos and re-shuffle the list
        if (this.tetrominoBag.length === 0) {
            this.tetrominoBag = this.shuffleTetromino();
        }
        return this.tetrominoBag.pop();
    }

    startTetromino(){ // initializing tetromino and defining starting position of it on the board
        const tetromino = this.getNextTetromino();
        const x = Math.floor((10 - tetromino.shape[0].length)/2);
        const y = 0;
        return {tetromino, x, y};
    }

    addTetromino(tetromino, x, y){ // adding tetromino on the board
        tetromino.shape.forEach ((row, i) => { // itirating through each 0 and 1 of the tetromino
            row.forEach ((cell, j) => {
                if (cell === 1) {
                    this.board[y + i][x + j] = 1; // placing each square of the tetromino on the board
                    this.colors[y + i][x + j] = tetromino.color; // storing tetromino color
                }
            });
        });
    }

    clearTetromino(tetromino, x, y){ // deleting tetromino before move, rotation etc
        tetromino.shape.forEach ((row, i) => {
            row.forEach ((cell, j) => {
                if (cell === 1) {
                    this.board[y + i][x + j] = 0;
                    this.colors[y + i][x + j] = null; // clearing tetromino color
                }
            });
        });
    }

    collision(tetromino, x, y){  // checking if tetromino after action is colliding with something

        return tetromino.shape.some((row, i) =>
            row.some ((cell, j) => {
                if (cell === 0) return false;

                const boardX = x + j;
                const boardY = y + i;
                
                // removing tetromino from the board before check insures that occupied cells within tetromino are not taken into account
                // checking for collision at the bottom, left, right and with existing blocks
                return ( 
                    boardY >= this.board.length ||
                    boardX < 0 ||
                    boardX >= this.board[0].length ||
                    this.board[boardY][boardX] === 1
                );
            })
        );
    }

    moveDown(tetromino, x, y) { // tetromino moving down
        this.clearTetromino(tetromino, x, y);
        if (this.collision(tetromino, x, y + 1)){ // check if move can be performed
            this.addTetromino(tetromino, x, y); // if collision detected add tetromino to the original position
            return false;
        } else {
            y++; // if no collision detected
            this.addTetromino(tetromino, x, y); 
            return {success: true, x, y};
        }
    }

    fastDrop (tetromino, x, y){ // faster tetromino drop if arrow down is pressed
        this.clearTetromino(tetromino, x, y);
        while (!this.collision(tetromino, x, y + 1)){
            y++;
        }
        this.addTetromino(tetromino, x, y);
        return {x, y};
    }

    moveRightLeft(tetromino, x, y, direction){ // allows to move tetromino left and right
        this.clearTetromino(tetromino, x, y);
        if (this.collision(tetromino, x + direction, y)){
            this.addTetromino(tetromino, x, y); // if collision detected add tetromino to the original position
            return false;
        } else {
            x += direction;
            this.addTetromino(tetromino, x, y);
            return { success: true, x, y };
        }
    }

    rotateTetromino(tetromino, x, y, direction){ // rotation of tetromino
        this.clearTetromino(tetromino, x, y);

        const originalShape = [...tetromino.shape.map(row => [...row])]; // creating copy of original tetromino position
        const originalX = x;

        // rotate tetromino
        if (direction === "clockwise") {
            tetromino.rotateClockwise();
        } else if (direction === "counterclockwise") {
            tetromino.rotateCounterclockwise();
        } else { 
            return false;
        }

        if (this.collision(tetromino, x, y)){ // checking if rotation is possible and adjust tetromino respectively
            // implementing bounce from the wall (not at the left wall)
            if (x > 0) {
                x--; // try to shift tetromino by 1 coordinate to the left 
                if (!this.collision(tetromino, x, y)){ // attempt rotation once again
                    this.addTetromino(tetromino, x, y);
                    return {success: true, x, y};
                }
                x = originalX; // if rotation fails even after shift reset to original position
            }

            // implementing bounce from the wall (not at the right wall)
            if (x + tetromino.shape[0].length < this.board[0].length) {
                x++;
                if (!this.collision(tetromino, x, y)) {
                    this.addTetromino(tetromino, x, y);
                    return {success: true, x, y};
                }
                x = originalX;
            }

            // if shift doesn't help rotation reset the tetromino position
            tetromino.shape = originalShape;
            this.addTetromino(tetromino, x, y);
            return false;
        } else {
            this.addTetromino(tetromino, x, y);
            return true;
        }
    }
    
    lockTetromino(tetromino, x, y) { // completing one tetromino move by locking tetromino on the board, delete completed line and adjust board accordingly
        this.addTetromino(tetromino, x, y);
        const linesCleared = this.clearLines(); // clearing lines with all 1 and keeping scoring of it
        const { tetromino: newTetromino, x: newX, y: newY }= this.startTetromino(); // placing new tetromino at the top and recording what shape and new coordinates of the 
        
        if (this.collision(newTetromino, newX, newY)) { // check if new tetromino can be placed and signify "Game Over"
            return "Game Over";
        } else {
            return { tetromino: newTetromino, x: newX, y: newY, linesCleared };
        }
    }

    updateLevel() { // counting levels (increasing level once 10 rows cleared)
        this.level = Math.floor(this.linesCleared / 10) + 1;
    }

    clearLines() { // removing lines full of tetrominos
        let linesClearedNow = 0;
        const newBoard = [];
        const newColors = [];

        // going through all board
        for (let row = this.board.length - 1; row >= 0; row--){
            if (this.board[row].every(cell => cell === 1)){ // checking if row is full
                linesClearedNow++;
            } else {
                newBoard.unshift([...this.board[row]]); // add not-full rows to the new board
                newColors.unshift([...this.colors[row]]);
            }
        }

        for (let i = 0; i < linesClearedNow; i++){ // adding empty rows at the top
            newBoard.unshift(Array(10).fill(0));
            newColors.unshift(Array(10).fill(null));
        }

        this.board = newBoard; // update board
        this.colors = newColors;
        this.linesCleared += linesClearedNow; // return the number of lines cleared
        this.updateLevel();

        // Tetris scoring application
        if (linesClearedNow === 1) this.score += 100;
        else if (linesClearedNow === 2) this.score += 300;
        else if (linesClearedNow === 3) this.score += 500;
        else if (linesClearedNow === 4) this.score += 800;

        return linesClearedNow;
    }

    // getting next tetromino from the shuffle bag
    nextTetrominoFromBag() {
        if (this.tetrominoBag.length === 0) {
            this.tetrominoBag = this.shuffleTetromino();
        }
        return this.tetrominoBag.pop();
    }
    
    // updates next tetromino
    getNextTetromino() {
        const current = this.nextTetromino; // Store the tetromino that's about to be used
        this.nextTetromino = this.nextTetrominoFromBag(); // Fetch the next one
        return current;
    }
}