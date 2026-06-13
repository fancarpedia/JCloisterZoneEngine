// Ported from src/test/java/com/jcloisterzone/board/PositionTest.java
import { describe, it, expect } from "vitest";
import { Position } from "./Position.js";
import { Rotation } from "./Rotation.js";

describe("Position (ported PositionTest)", () => {
  it("add", () => {
    expect(new Position(2, 3).add(new Position(3, 7)).equals(new Position(5, 10))).toBe(true);
  });

  it("subtract", () => {
    expect(
      new Position(2, 3).subtract(new Position(3, 7)).equals(new Position(-1, -4)),
    ).toBe(true);
  });

  it("rotateCW", () => {
    expect(new Position(2, 3).rotateCW(Rotation.R0).equals(new Position(2, 3))).toBe(true);
    expect(new Position(2, 3).rotateCW(Rotation.R90).equals(new Position(-3, 2))).toBe(true);
    expect(new Position(2, 3).rotateCW(Rotation.R180).equals(new Position(-2, -3))).toBe(true);
    expect(new Position(2, 3).rotateCW(Rotation.R270).equals(new Position(3, -2))).toBe(true);
  });
});
