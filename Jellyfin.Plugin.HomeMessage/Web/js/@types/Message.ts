export interface Message {
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
}
