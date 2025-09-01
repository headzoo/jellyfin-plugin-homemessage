import { Message } from './@types/Message';
import { createElement } from './utils';

(async () => {
  const { ApiClient } = window;
  const cssClassPrefix = 'home-message';

  /**
   * Displays a message on the home page.
   *
   * @param messageElements The #indexPage element.
   * @param message The message to display.
   */
  const displayMessage = (messageElements: HTMLElement, message: Message) => {
    const messageElement = createElement('div', {
      class: `${cssClassPrefix}-message`,
      style: `background-color: ${message.BgColor}; color: ${message.TextColor};`,
    });

    if (message.Dismissible) {
      const btn = createElement('button', {
        title: 'Close',
        class: `${cssClassPrefix}-dismiss`,
        html: '&times;',
      });
      btn.addEventListener('click', async () => {
        messageElements.removeChild(messageElement);
        const url = ApiClient.getUrl(`HomeMessage/messages/${message.Id}`);
        await ApiClient.ajax({
          type: 'DELETE',
          url,
        });
      });
      messageElement.appendChild(btn);
    }

    const titleElement = createElement('h3', {
      class: `${cssClassPrefix}-title`,
      html: message.Title,
    });
    messageElement.appendChild(titleElement);

    const textElement = createElement('p', {
      class: `${cssClassPrefix}-text`,
      html: message.Text,
    });
    messageElement.appendChild(textElement);

    messageElements.appendChild(messageElement);
  };

  /**
   * Called when the page is ready.
   *
   * @param indexPage The #indexPage element.
   */
  const ready = async (indexPage: HTMLElement) => {
    const messageElements = createElement('div', {
      class: `${cssClassPrefix}-messages emby-scroller`,
    });
    indexPage.prepend(messageElements);

    const url = ApiClient.getUrl('HomeMessage/messages');
    const messages = await ApiClient.getJSON<Message[]>(url);
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      displayMessage(messageElements, message);
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
