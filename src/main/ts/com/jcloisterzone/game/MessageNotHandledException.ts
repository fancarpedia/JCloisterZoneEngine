/** Thrown when no phase handler accepts a message. */
export class MessageNotHandledException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessageNotHandledException";
  }
}
