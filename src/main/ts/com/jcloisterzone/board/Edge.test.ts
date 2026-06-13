// Ported from src/test/java/com/jcloisterzone/board/EdgeTest.java
import { describe, it, expect } from "vitest";
import { Edge } from "./Edge.js";
import { Position } from "./Position.js";
import { Rotation } from "./Rotation.js";

const P = (x: number, y: number) => new Position(x, y);

describe("Edge (ported EdgeTest)", () => {
  it("translate", () => {
    expect(
      new Edge(P(0, 0), P(0, 1)).translate(P(2, 3)).equals(new Edge(P(2, 3), P(2, 4))),
    ).toBe(true);
  });

  it("rotateCW", () => {
    expect(
      new Edge(P(0, 0), P(0, 1)).rotateCW(P(0, 0), Rotation.R90).equals(new Edge(P(-1, 0), P(0, 0))),
    ).toBe(true);
    expect(
      new Edge(P(0, 0), P(0, 1)).rotateCW(P(0, 0), Rotation.R0).equals(new Edge(P(0, 0), P(0, 1))),
    ).toBe(true);
    expect(
      new Edge(P(0, 0), P(0, 1)).rotateCW(P(0, 1), Rotation.R90).equals(new Edge(P(0, 1), P(1, 1))),
    ).toBe(true);
  });

  it("rotateCCW", () => {
    expect(
      new Edge(P(0, 0), P(0, 1)).rotateCCW(P(0, 0), Rotation.R90).equals(new Edge(P(0, 0), P(1, 0))),
    ).toBe(true);
    expect(
      new Edge(P(0, 0), P(0, 1)).rotateCCW(P(0, 1), Rotation.R90).equals(new Edge(P(-1, 1), P(0, 1))),
    ).toBe(true);
  });
});
