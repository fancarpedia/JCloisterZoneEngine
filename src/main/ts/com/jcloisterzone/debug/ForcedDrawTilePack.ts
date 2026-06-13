import { LinkedHashMap } from "../../../io/vavr/Map.js";
import { Queue } from "../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../io/vavr/Tuple.js";
import type { RandomGenerator } from "../random/RandomGenerator.js";
import type { Tile } from "../board/Tile.js";
import type { TileGroup } from "../board/TileGroup.js";
import { TilePack } from "../board/TilePack.js";

/**
 * Tile pack with a predefined draw order (debug / integration-test helper). Port
 * of {@code com.jcloisterzone.debug.ForcedDrawTilePack}. Replaces the default
 * pack via the saved game's {@code gameAnnotations} so replays are deterministic.
 */
export class ForcedDrawTilePack extends TilePack {
  private readonly drawQueue: Queue<string>;
  private readonly drawLimit: number | null;

  constructor(
    groups: LinkedHashMap<string, TileGroup>,
    hiddenUnderHills: number,
    drawQueue: Queue<string>,
    drawLimit: number | null,
  ) {
    super(groups, hiddenUnderHills);
    this.drawQueue = drawQueue;
    this.drawLimit = drawLimit;
  }

  /** Build from the annotation params object ({drawOrder, drawLimit}). */
  static fromParams(
    groups: LinkedHashMap<string, TileGroup>,
    params: { drawOrder?: string[]; drawLimit?: number | null } | null,
  ): ForcedDrawTilePack {
    const drawOrder = params?.drawOrder ?? null;
    const queue = drawOrder === null ? Queue.empty<string>() : Queue.ofAll(drawOrder);
    const limitRaw = params?.drawLimit;
    const limit = limitRaw === undefined || limitRaw === null ? null : Math.trunc(limitRaw);
    return new ForcedDrawTilePack(groups, 0, queue, limit);
  }

  override setGroups(groups: LinkedHashMap<string, TileGroup>): ForcedDrawTilePack {
    if (this.getGroups() === groups) return this;
    return new ForcedDrawTilePack(groups, this.getHiddenUnderHills(), this.drawQueue, this.drawLimit);
  }

  override setHiddenUnderHills(hiddenUnderHills: number): ForcedDrawTilePack {
    if (this.getHiddenUnderHills() === hiddenUnderHills) return this;
    return new ForcedDrawTilePack(this.getGroups(), hiddenUnderHills, this.drawQueue, this.drawLimit);
  }

  private setDrawList(drawQueue: Queue<string>): ForcedDrawTilePack {
    if (this.drawQueue === drawQueue) return this;
    return new ForcedDrawTilePack(this.getGroups(), this.getHiddenUnderHills(), drawQueue, this.drawLimit);
  }

  private setDrawLimit(drawLimit: number | null): ForcedDrawTilePack {
    if (this.drawLimit === drawLimit) return this;
    return new ForcedDrawTilePack(this.getGroups(), this.getHiddenUnderHills(), this.drawQueue, drawLimit);
  }

  override drawTile(a: RandomGenerator | string, tileId?: string): Tuple2<Tile, TilePack> {
    if (typeof a !== "string" && tileId === undefined) {
      // drawTile(RandomGenerator)
      if (!this.drawQueue.isEmpty()) {
        const [id, rest] = this.drawQueue.dequeue();
        const res = super.drawTile(id);
        const pack = (res._2 as ForcedDrawTilePack).setDrawList(rest);
        return new Tuple2(res._1, pack);
      }
      const res = super.drawTile(a);
      return this.decreaseTileLimit(res);
    }
    if (typeof a === "string" && tileId !== undefined) {
      // drawTile(groupName, tileId)
      const res = super.drawTile(a, tileId);
      return this.decreaseTileLimit(res);
    }
    // drawTile(tileId) — delegates to (groupName, tileId) per active group
    return super.drawTile(a as string);
  }

  private decreaseTileLimit(res: Tuple2<Tile, TilePack>): Tuple2<Tile, TilePack> {
    if (this.drawLimit === null) return res;
    const pack = res._2 as ForcedDrawTilePack;
    return new Tuple2(res._1, pack.setDrawLimit((pack.drawLimit ?? 0) - 1));
  }

  override totalSize(): number {
    if (this.drawLimit !== null) return this.drawLimit;
    return super.totalSize();
  }

  override size(): number {
    if (this.drawLimit !== null) return this.drawLimit;
    // a trailing "#END" sentinel ends the game on that element
    if (!this.drawQueue.isEmpty() && this.drawQueue.last() === "#END") {
      return this.drawQueue.size() - 1;
    }
    return super.size();
  }

  protected override getInternalSize(): number {
    // don't let drawLimit affect the internal (random-draw) size
    return super.size() + this.getHiddenUnderHills();
  }

  getDrawQueue(): Queue<string> {
    return this.drawQueue;
  }
}
