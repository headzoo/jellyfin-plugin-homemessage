export interface Message {
  /**
   * The ID of the message.
   */
  Id: string;

  /**
   * The title of the message.
   */
  Title: string;

  /**
   * The message.
   */
  Text: string;

  /**
   * Whether or not the message is dismissible.
   */
  Dismissible: boolean;

  /**
   * The background color of the message.
   */
  BgColor: string;

  /**
   * The text color of the message.
   */
  TextColor: string;

  /**
   * The time when the message should be shown.
   */
  TimeStart?: number;

  /**
   * The time when the message should be hidden.
   */
  TimeEnd?: number;

  /**
   * Unix timestamp of when the message was created.
   */
  CreatedTime: number;
}

/**
 * Represents a message input.
 */
export interface MessageInput {
  Title: string;
  Text: string;
  Dismissible: boolean;
  BgColor: string;
  TextColor: string;
  TimeStart: number | null;
  TimeEnd: number | null;
}
