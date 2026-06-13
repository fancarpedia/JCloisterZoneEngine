import type { Message } from "./Message.js";

/**
 * Base message. The Java {@code @MessageCommand("X")} annotation is replaced by
 * a static `command` field on each concrete message class.
 */
export abstract class AbstractMessage implements Message {
  toString(): string {
    const command = (this.constructor as { command?: string }).command;
    return command ?? this.constructor.name;
  }
}
