export class Person {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    characterPosition: 'left' | 'right';
    private characterPositions: Record<string, { x: number; y: number }>;
    private characterWidth: number;
    private characterHeight: number;
    private characterImage: HTMLImageElement;


    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.characterPosition = 'right';
        this.characterPositions = {
            left: {
                x: canvas.width / 2 - 160,
                y: canvas.height - 350,
            },
            right: {
                x: canvas.width / 2 + 80,
                y: canvas.height - 350,
            },
        };
        this.characterWidth = 100;
        this.characterHeight = 180;
        this.characterImage = new Image();
        this.characterImage.src = '/images/character.png';
    }

    draw(): void {

        const characterPosition = this.characterPositions[this.characterPosition];
        if (this.characterPosition === 'right') {
            this.ctx.save();
            this.ctx.translate(
                characterPosition.x + this.characterWidth / 2,
                characterPosition.y + this.characterWidth / 2
            );
            this.ctx.scale(-1, 1);
            this.ctx.translate(
                -(characterPosition.x + this.characterWidth / 2),
                -(characterPosition.y + this.characterWidth / 2)
            );
        }
        this.ctx.drawImage(
            this.characterImage,
            0,
            0,
            this.characterImage.width,
            this.characterImage.height,
            characterPosition.x,
            characterPosition.y,
            this.characterWidth,
            this.characterHeight
        );
        if (this.characterPosition === 'right') this.ctx.restore();
    }

    moveLeft(): void {
        this.characterPosition = 'left';
    }

    moveRight(): void {
        this.characterPosition = 'right';
    }
}