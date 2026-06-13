/**
 * Minimal pure-TS replacement for java.awt.Rectangle — the only AWT geometry
 * type the engine core touches (via BoardMixin.getBoardBounds). No AWT / no DOM.
 */
export class Rectangle {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {}

  toString(): string {
    return `java.awt.Rectangle[x=${this.x},y=${this.y},width=${this.width},height=${this.height}]`;
  }
}
