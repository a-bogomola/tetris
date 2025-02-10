document.addEventListener("DOMContentLoaded", () => {

    const startScreen = document.getElementById("start-screen");
    const gameMain = document.getElementById("game-main");
    const gameoverScreen = document.getElementById("gameover-screen");
    const startButton = document.getElementById("start-button");
    const playAgainButton = document.getElementById("play-again");
    const gameboardElement = document.getElementById("gameboard");
    
    let gameboard, tetromino, x, y, gameSpeed, gameInterval;

    startButton.addEventListener("click", startGame);
    playAgainButton.addEventListener("click", restartGame);

    function startGame() { // hide start screen and show the game container
        startScreen.style.display = "none";
        gameMain.style.display = "block";
        initGame();
    }

    function restartGame(){ // hide the game over screen and reload the game
        gameoverScreen.style.display = "none";
        initGame();
    }

    let highScore = localStorage.getItem("highScore") || 0;  // Get high score or default to 0 ad declaring as global variable

    function initGame(){ // initialize the game
        gameboard = new Gameboard();
        const startTetData = gameboard.startTetromino();
        tetromino = startTetData.tetromino;
        x = startTetData.x;
        y = startTetData.y;
        gameSpeed = 500;
        gameInterval = setInterval(gameLoop, gameSpeed);

        gameboard.nextTetromino = gameboard.nextTetrominoFromBag();

        gameboard.score = 0; // Ensure score starts at 0
        document.getElementById("score").textContent = 0; // Reset the score display immediately
        document.getElementById("level").textContent = 1;
        document.getElementById("high-score").textContent = highScore; // display current high score

        renderNextTetromino();
        addKeyListeners();
        updateGameSpeed();
        renderTetromino();
    }

    // render gameboard
    function renderGameboard() {
        // reset the board
        gameboardElement.innerHTML = "";

        // initializing each square of the board
        gameboard.board.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellElement = document.createElement("div");
                cellElement.classList.add("cell");

                const cellColor = gameboard.colors[rowIndex][colIndex];
                cellElement.style.backgroundColor = cell === 0 ? "#E6E6FA" : cellColor; // assigning color depending if cell is 1 or 0
                
                gameboardElement.appendChild(cellElement);
            });
        });
    }

    // render tetromino
    function renderTetromino(){

        gameboard.addTetromino(tetromino, x, y); // place tetromino on the board
        renderGameboard(); // re-render board to reflect situation on the board
    }

    // game loop
    function gameLoop(){
        const moveResult = gameboard.moveDown(tetromino, x, y); // attempt to move down by one row
        if (moveResult){ // if yes coordinates changes
            ({ x, y } = moveResult);
        } else { // if not game over is declared or line locking is happening
            const result = gameboard.lockTetromino(tetromino, x, y);
            if (result === "Game Over"){
                clearInterval(gameInterval);
                gameoverScreen.style.display = "flex";
                return;
            } else {
                ({ tetromino, x, y } = result);
                updateScoreAndLevel();
                updateGameSpeed();
                renderNextTetromino();
            }
        }
        
        renderTetromino();
    }

    function updateGameSpeed(){
        gameSpeed = Math.max(100, 500 - (gameboard.level * 50)); // increasing game speed by 50 with each level and it neve goes blow 100
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }

    function updateScoreAndLevel() { // updating scoring and level display
        document.getElementById("score").textContent = gameboard.score;
        document.getElementById("level").textContent = gameboard.level;

        // Update high score if the current score is higher
        if (gameboard.score > highScore) {
            highScore = gameboard.score;
            localStorage.setItem("highScore", highScore);  // Save new high score
            document.getElementById("high-score").textContent = highScore; // Update UI
        }
    }

    function addKeyListeners(){
        document.removeEventListener("keydown", keyHandler); // remove previous listener
        document.addEventListener("keydown", keyHandler); // add new key listener
      }

    function keyHandler(event) {
        switch (event.key) {
            case "ArrowLeft":
                const leftMove = gameboard.moveRightLeft(tetromino, x, y, -1);
                if (leftMove && leftMove.success) ({ x, y } = leftMove);
                break;
            case "ArrowRight":
                const rightMove = gameboard.moveRightLeft(tetromino, x, y, 1);
                if (rightMove && rightMove.success)({ x, y } = rightMove);
                break;
            case "ArrowDown":
                gameLoop();
                break;
            case "ArrowUp":
                const rotation = gameboard.rotateTetromino(tetromino, x, y, "clockwise");
                if (rotation && rotation.success) ({x, y} = rotation);
                break;
            case " ":
                clearInterval(gameInterval);
                const dropResult = gameboard.fastDrop(tetromino, x, y);
                ({ x, y } = dropResult);

                const lockResult = gameboard.lockTetromino(tetromino, x, y);
                if (lockResult === "Game Over") {
                    gameoverScreen.style.display = "flex";
                    clearInterval(gameInterval);
                    return;
                } else {
                    ({ tetromino, x, y } = lockResult);
                    renderNextTetromino();
                }
                renderTetromino();
                gameInterval = setInterval(gameLoop, 500);
                break;
        }
        renderTetromino();
    }

    // getting and displaying next tetromino
    function renderNextTetromino() {
        const nextTetrominoElement = document.getElementById("next-tetromino");
        nextTetrominoElement.innerHTML = ""; // Clear previous display
        
        if (!gameboard.nextTetromino) return;

        const shape = gameboard.nextTetromino.shape;
        const gridSize = 4;

        nextTetrominoElement.style.display = "grid";
        nextTetrominoElement.style.gridTemplateRows = `repeat(${gridSize}, 22px)`;
        nextTetrominoElement.style.gridTemplateColumns = `repeat(${gridSize}, 22px)`;

        let offsetX = Math.floor((gridSize - shape[0].length) / 2);
        let offsetY = Math.floor((gridSize - shape.length) / 2);

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cellElement = document.createElement("div");
                cellElement.classList.add("cell");
    
                // Place tetromino shape in the correct position
                if (
                    row - offsetY >= 0 && row - offsetY < shape.length &&
                    col - offsetX >= 0 && col - offsetX < shape[0].length &&
                    shape[row - offsetY][col - offsetX] === 1
                ) {
                    cellElement.style.backgroundColor = gameboard.nextTetromino.color;
                } else {
                    cellElement.style.backgroundColor = "transparent";
                }

                nextTetrominoElement.appendChild(cellElement);
            }
        }
    }

});