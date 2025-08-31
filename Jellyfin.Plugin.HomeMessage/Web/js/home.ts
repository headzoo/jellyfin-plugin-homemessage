import { Message } from './@types/Message';

(async () => {
  const { ApiClient } = window;

  /**
   * Displays a message on the home page.
   *
   * @param {HTMLElement} indexPage The #indexPage element.
   * @param {Message} message The message to display.
   */
  const displayMessage = (indexPage: HTMLElement, message: Message) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('home-message-message');
    messageElement.innerText = message.Title;
    messageElement.style.backgroundColor = message.BgColor;
    messageElement.style.color = message.TextColor;
    indexPage.prepend(messageElement);
  };

  /**
   * Called when the page is ready.
   *
   * @param {HTMLElement} indexPage The #indexPage element.
   */
  const ready = async (indexPage: HTMLElement) => {
    const url = ApiClient.getUrl('HomeMessage/messages');
    const messages = await ApiClient.getJSON<Message[]>(url);
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      displayMessage(indexPage, message);
    }
  };

  /**
   * Waits for the #indexPage element to be available, then calls ready().
   */
  const boot = async () => {
    const indexPage = document.getElementById('indexPage');
    if (!indexPage) {
      setTimeout(async () => await boot(), 100);
      return;
    }

    await ready(indexPage);
  };
  await boot();
})();
