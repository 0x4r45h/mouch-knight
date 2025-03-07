import {Person} from "@/components/game/Person";
import {Tree} from "@/components/game/Tree";

// Define the expected detail type for our custom events.
export interface GameEventDetail {
    score?: number;
    mkt?: number;
    highScore?: number;
}
export class GameLogic {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private person: Person | null = null;
    private tree: Tree | null = null;
    private score: number = 0;
    private mkt: number = 0;
    private highScore: number;

    private btnLeft: HTMLButtonElement;
    private btnRight: HTMLButtonElement;
    private cutSound: HTMLAudioElement;
    private landImage: HTMLImageElement;

    private static readonly DEFAULT_PROGRESS: number =  0.5; // Range between 0 (empty) and 1 (full). Starts at half.
    private static readonly DEFAULT_BASE_DEPLETION_RATE: number =  0.002; // Base depletion rate per interval tick.
    private static readonly DEFAULT_DEPLETION_INTERVAL: number =  100; // Time in milliseconds between each depletion tick.
    private static readonly DEFAULT_BOOST_AMOUNT: number =  0.02; // Increase in progress for each move.
    private static readonly DEFAULT_DIFFICULTY_FACTOR: number =  4; // This factor multiplies the depletion; tuning knob for difficulty.
    private static readonly DEFAULT_DIFFICULTY_FACTOR_RATE: number =  0.005;  // This factor increases the difficulty rate over time
    private progress: number = GameLogic.DEFAULT_PROGRESS; // Range between 0 (empty) and 1 (full). Starts at half.
    private difficultyFactor: number = GameLogic.DEFAULT_DIFFICULTY_FACTOR; // This factor multiplies the depletion; tuning knob for difficulty.
    private depletionTimer: number | null = null;

    // Public event target to emit custom events.
    public eventTarget: EventTarget = new EventTarget();

    constructor(
        canvas: HTMLCanvasElement,
        btnLeft: HTMLButtonElement,
        btnRight: HTMLButtonElement,
        canvasWidth: number,
        canvasHeight: number
    ) {
        this.canvas = canvas;
        this.btnLeft = btnLeft;
        this.btnRight = btnRight;

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error('Unable to get canvas context');
        }
        this.ctx = context;

        this.cutSound = new Audio('/audio/cut.wav');
        this.highScore = Number(localStorage.getItem('highScore')) || 0;

        this.landImage = new Image();
        this.landImage.src = '/images/land.png'; // Load the image once

        this.setupListeners();
    }

    init(): void {
        this.person = new Person(this.canvas);
        this.tree = new Tree(this.canvas, this.canvas.width / 2, this.canvas.height - 350);
        this.tree.init();
        this.score = 0;
        this.progress = GameLogic.DEFAULT_PROGRESS;
        this.difficultyFactor = GameLogic.DEFAULT_DIFFICULTY_FACTOR;

        this.startProgressTimer();
        this.drawBackground();

        this.eventTarget.dispatchEvent(new CustomEvent<GameEventDetail>('init', {
            detail: {}
        }));
    }

    /**
     * Starts the game rendering loop.
     */
    render(): void {
        this.draw();
        requestAnimationFrame(() => this.render());
    }

    drawBackground(): void {
        this.ctx.fillStyle = '#d3f7ff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Use the preloaded land image
        this.ctx.drawImage(this.landImage, 0, this.canvas.height - 300, this.canvas.width, 350);
    }

    drawScore(): void {
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = "start";

        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('Score', 30, 30);

        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillText(String(this.score), 30, 60);

        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('MKT', 30, 100);

        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillText(String(this.mkt), 30, 130);

        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('Highscore', 30, 170);

        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillText(String(this.highScore), 30, 200);
    }

    /**
     * Draws the progress bar at the top right of the canvas.
     * The bar color changes based on current progress:
     * Red below 25%, Purple between 26%-74%, Green above 75%.
     */
    private drawProgressBar(): void {
        const barWidth = 100;
        const barHeight = 20;
        const margin = 20;
        const x = this.canvas.width - barWidth - margin;
        const y = margin;

        // Determine bar fill width based on progress.
        const fillWidth = this.progress * barWidth;

        // Choose color based on threshold.
        let fillColor = '#836EF9';
        if (this.progress <= 0.25) {
            fillColor = '#A0055D';
        } else if (this.progress >= 0.75) {
            fillColor = 'green';
        }

        // Draw the background (bar container).
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(x, y, barWidth, barHeight);

        // Draw the fill.
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, fillWidth, barHeight);
    }

    /**
     * Renders the entire game scene.
     */
    draw(): void {
        this.drawBackground();
        if (this.tree) {
            this.tree.draw(this.calcMultiplier());
        }
        if (this.person) {
            this.person.draw();
        }
        this.drawScore();
        this.drawProgressBar();
    }

    private calcMultiplier() {
        return Math.floor(this.getScore() / 10);
    }
    /**
     * Handles player's move actions.
     * Plays the cut sound, updates the game state, and checks for collisions.
     * Also boosts the progress bar with each move.
     * @param direction 'left' or 'right'
     */
    move(direction: 'left' | 'right'): void {
        // Play the cut sound on each move.
        this.cutSound.currentTime = 0;
        this.cutSound.play();

        // Boost progress on each move.
        this.progress = Math.min(this.progress + GameLogic.DEFAULT_BOOST_AMOUNT, 1);

        // Move the person according to the direction.
        if (this.person) {
            if (direction === 'left') {
                this.person.moveLeft();
            } else {
                this.person.moveRight();
            }
        }

        if (this.tree) {
            // Remove the top trunk.
            this.tree.trees.shift();
            // Create a new trunk.
            this.tree.createNewTrunk();
        }
        this.score++;
        this.updateMKT(this.score);
        // Dispatch a scoreUpdate event.
        this.eventTarget.dispatchEvent(new CustomEvent<GameEventDetail>('scoreChange', {
            detail: { score: this.score }
        }));

        // Collision detection based on person position vs. tree trunk.
        if (this.tree && this.tree.trees.length > 0 && this.person) {
            const currentTrunk = this.tree.trees[0];
            if (
                (currentTrunk.value === 'left' && this.person.characterPosition === 'left') ||
                (currentTrunk.value === 'right' && this.person.characterPosition === 'right')
            ) {
                this.endGame();
                return;
            }
        }
    }
    private updateMKT(currentScore : number) {
        if (currentScore < 11) {
            return;
        }
        this.mkt += this.calcMultiplier()

    }
    /**
     * Ends the game when a collision or time out occurs.
     * Dispatches a gameOver event and stops the progress timer.
     */
    private endGame(): void {
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        this.eventTarget.dispatchEvent(new CustomEvent<GameEventDetail>('gameOver', {
            detail: { score: this.score, highScore: this.highScore, mkt: this.mkt }
        }));
        // Stop the progress timer.
        if (this.depletionTimer !== null) {
            clearInterval(this.depletionTimer);
            this.depletionTimer = null;
        }
    }

    /**
     * Starts the timer that depletes the progress bar.
     */
    private startProgressTimer(): void {
        if (this.depletionTimer !== null) {
            clearInterval(this.depletionTimer);
        }
        this.depletionTimer = window.setInterval(() => {
            // Deplete progress.
            this.progress = Math.max(this.progress - (GameLogic.DEFAULT_BASE_DEPLETION_RATE * this.difficultyFactor), 0);
            // Increase difficulty over time.
            this.difficultyFactor += GameLogic.DEFAULT_DIFFICULTY_FACTOR_RATE;
            // If progress reaches 0, game over.
            if (this.progress <= 0) {
                this.endGame();
            }
        }, GameLogic.DEFAULT_DEPLETION_INTERVAL);
    }

    /**
     * Restarts the game state.
     * This function can be called when the game is over or when a new game is desired.
     */
    restartGame(): void {
        // Reset the game state.
        this.score = 0;
        this.highScore = Number(localStorage.getItem('highScore')) || 0;
        this.progress = GameLogic.DEFAULT_PROGRESS;
        this.difficultyFactor = GameLogic.DEFAULT_DIFFICULTY_FACTOR;

        // Reinitialize game entities.
        if (this.person && this.tree) {
            this.init();
            this.draw();
        }
    }

    destroy(): void {
        this.btnLeft.removeEventListener('click', this.handleLeftClick);
        this.btnRight.removeEventListener('click', this.handleRightClick);

        window.removeEventListener('keydown', this.handleKeyDown);

        this.cutSound.pause();
        this.cutSound.currentTime = 0;

        // Stop the progress depletion timer.
        if (this.depletionTimer !== null) {
            clearInterval(this.depletionTimer);
            this.depletionTimer = null;
        }

        // Clear the canvas.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Nullify references to game entities.
        this.person = null;
        this.tree = null;
    }
    public getScore() {
        return this.score
    }
    private handleLeftClick = () => {
        this.move('left');
    };

    private handleRightClick = () => {
        this.move('right');
    };

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'a' || e.key === 'ArrowLeft') this.move('left');
        else if (e.key === 'd' || e.key === 'ArrowRight') this.move('right');
    };

    /**
     * Registers event listeners for game controls.
     */
    private setupListeners(): void {
        this.btnLeft.addEventListener('click', this.handleLeftClick);
        this.btnRight.addEventListener('click', this.handleRightClick);
        window.addEventListener('keydown', this.handleKeyDown);
    }
}