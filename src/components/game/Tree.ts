// Define a type for the tree trunk object.
import {randomNumber, roundRect} from "@/components/game/Helper";

type TreeTrunk = {
    value: number | 'left' | 'right';
    color: string;
};

export class Tree {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private startX: number;
    private startY: number;
    private width: number;
    private height: number;
    trees: TreeTrunk[];
    private treesPossibility: (number | 'left' | 'right')[];
    private trunkColor: string;
    private stoneColor: string;
    private stemWidth: number;
    private stemHeight: number;
    private starterTree: number;

    constructor(canvas: HTMLCanvasElement, startX: number, startY: number) {
        this.canvas = canvas;
        this.startX = startX;
        this.startY = startY;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D context from canvas');
        }
        this.ctx = context;
        this.width = 100;
        this.height = 150;
        this.trees = [];
        // Possibilities: 0, "left", "right". The 0 value may represent "no trunk" or default trunk.
        this.treesPossibility = [0, 'left', 'right'];
        this.trunkColor = "brown";
        this.stoneColor = 'grey';
        this.stemWidth = 100;
        this.stemHeight = 30;
        this.starterTree = 10;
    }

    // Initializes the tree trunks.
    init(): void {
        for (let i = 1; i <= this.starterTree; i++) {
            let newTrunk: number | 'left' | 'right' = 0;
            // Alternate trunk colors.
            const color = i % 2 ? '#836EF9' : '#200052';
            newTrunk = this.treesPossibility[randomNumber(2)];
            this.trees.push({
                value: newTrunk,
                color
            });
        }
    }

    // Creates a new trunk based on the last one, alternating color.
    createNewTrunk(): void {
        const lastColor = this.trees[this.trees.length - 1].color;
        const color = lastColor === '#836EF9' ? '#200052' : '#836EF9';
        const newTrunk = this.treesPossibility[randomNumber(3)];
        this.trees.push({
            value: newTrunk,
            color
        });
    }

    // Draws the tree trunks and additional elements on the canvas.
    draw(): void {
        // Center x-coordinate based on the canvas width and tree trunk width.
        const x = this.canvas.width / 2 - this.width / 2;
        this.trees.forEach((tree, index) => {
            this.ctx.fillStyle = tree.color;
            // Draw the main tree trunk.
            this.ctx.fillRect(x, this.startY - (index * this.height), this.width, this.height);

            // Draw left extension if applicable.
            if (tree.value === 'left') {
                // Using roundRect, which is an experimental API.
                roundRect(
                    this.ctx,
                    x - this.stemWidth,
                    this.startY - (index * this.height) + this.height / 2,
                    this.stemWidth,
                    this.stemHeight,
                    {upperLeft: 10, lowerLeft: 10},
                    true,
                    false
                );
            }
            // Draw right extension if applicable.
            if (tree.value === 'right') {
                roundRect(
                    this.ctx,
                    x + this.width,
                    this.startY - (index * this.height) + this.height / 2,
                    this.stemWidth,
                    this.stemHeight,
                    {upperRight: 10, lowerRight: 10},
                    true,
                    false
                );
            }
        });

        // Draw additional elements (stones, etc.)
        this.ctx.fillStyle = this.stoneColor;
        roundRect(
            this.ctx,
            x - 4,
            this.startY + this.height - 10,
            50,
            30,
            {upperLeft: 10, upperRight: 10, lowerLeft: 10, lowerRight: 10},
            true,
            false
        );
        this.ctx.fillStyle = '#95a5a6';
        roundRect(
            this.ctx,
            x + 20,
            this.startY + this.height - 10,
            85,
            30,
            {upperLeft: 10, upperRight: 10, lowerLeft: 10, lowerRight: 10},
            true,
            false
        );
    }
}