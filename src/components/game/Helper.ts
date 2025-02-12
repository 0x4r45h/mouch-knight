/**
 * File: /lib/Helper.ts
 * This module provides helper functions for canvas drawing and random number generation.
 * Instead of modifying prototypes, we define standard functions to avoid side effects.
 */

// Define a type for corner radius options.
type CornerRadius = {
    upperLeft?: number;
    upperRight?: number;
    lowerLeft?: number;
    lowerRight?: number;
};

/**
 * Draws a rounded rectangle on the provided canvas rendering context.
 *
 * @param ctx - The canvas rendering context to draw on.
 * @param x - The x-coordinate of the rectangle's starting point.
 * @param y - The y-coordinate of the rectangle's starting point.
 * @param width - The width of the rectangle.
 * @param height - The height of the rectangle.
 * @param radius - The corner radius. Can be a number for uniform radius or an object specifying individual corner radii.
 * @param fill - Whether to fill the rectangle.
 * @param stroke - Whether to stroke the rectangle. Defaults to true.
 */
export function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | CornerRadius = 0,
    fill?: boolean,
    stroke: boolean = true
): void {
    // Initialize corner radius values.
    let cornerRadius = {
        upperLeft: 0,
        upperRight: 0,
        lowerLeft: 0,
        lowerRight: 0,
    };

    if (typeof radius === 'number') {
        // Use the same radius for all corners.
        cornerRadius = {
            upperLeft: radius,
            upperRight: radius,
            lowerLeft: radius,
            lowerRight: radius,
        };
    } else if (typeof radius === 'object') {
        // Use provided radius values or default to 0.
        cornerRadius = {
            upperLeft: radius.upperLeft ?? 0,
            upperRight: radius.upperRight ?? 0,
            lowerLeft: radius.lowerLeft ?? 0,
            lowerRight: radius.lowerRight ?? 0,
        };
    }

    ctx.beginPath();
    ctx.moveTo(x + cornerRadius.upperLeft, y);
    ctx.lineTo(x + width - cornerRadius.upperRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
    ctx.lineTo(x + width, y + height - cornerRadius.lowerRight);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius.lowerRight, y + height);
    ctx.lineTo(x + cornerRadius.lowerLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
    ctx.lineTo(x, y + cornerRadius.upperLeft);
    ctx.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
    ctx.closePath();

    if (stroke) {
        ctx.stroke();
    }
    if (fill) {
        ctx.fill();
    }
}

/**
 * Generates a random integer from 0 (inclusive) to the specified length (exclusive).
 *
 * @param length - The exclusive upper bound for the random number.
 * @returns A random integer between 0 and length - 1.
 */
export function randomNumber(length: number): number {
    return Math.floor(Math.random() * length);
}