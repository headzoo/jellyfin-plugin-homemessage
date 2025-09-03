import { Message } from './@types/Message';
import { createElement, paragraphsFromText } from './utils';

(async () => {
  const { ApiClient } = window;
  const cssClassPrefix = 'home-message';
  const pluginUniqueId = '69d36d38-5615-4128-b2e0-30caf4c5ba86';

  /**
   * Displays a message on the home page.
   *
   * @param messageElements The #indexPage element.
   * @param message The message to display.
   */
  const displayMessage = (messageElements: HTMLElement, message: Message) => {
    const messageItem = createElement('li');
    messageElements.appendChild(messageItem);

    const messageBody = createElement('div', {
      class: `${cssClassPrefix}-body`,
      style: `background-color: ${message.BgColor}; color: ${message.TextColor};`,
    });
    messageItem.appendChild(messageBody);

    if (message.Dismissible) {
      const btn = createElement('button', {
        title: 'Close',
        class: `${cssClassPrefix}-dismiss`,
        html: '&times;',
      });
      btn.addEventListener('click', async () => {
        messageElements.removeChild(messageBody);
        const url = ApiClient.getUrl(`HomeMessage/messages/${message.Id}`);
        await ApiClient.ajax({
          type: 'DELETE',
          url,
        });
      });
      messageBody.appendChild(btn);
    }

    const titleElement = createElement('h3', {
      class: `${cssClassPrefix}-title`,
      html: message.Title,
    });
    messageBody.appendChild(titleElement);

    const createdDate = new Date(message.CreatedTime * 1000);
    const timeElement = createElement('time', {
      class: `${cssClassPrefix}-time`,
      html: `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`,
    });
    messageBody.appendChild(timeElement);

    const textElement = createElement('div', {
      class: `${cssClassPrefix}-text`,
      html: paragraphsFromText(message.Text),
    });
    messageBody.appendChild(textElement);
  };

  /**
   * Called when the page is ready.
   *
   * @param indexPage The #indexPage element.
   */
  const ready = async (indexPage: HTMLElement) => {
    // Load configuration styles.
    ApiClient.getPluginConfiguration(pluginUniqueId)
      .then(async (config: any) => {
        const styles = config.Styles || '';
        if (styles) {
          const style = document.createElement('style');
          style.innerHTML = styles;
          document.head.appendChild(style);
        }

        const container = createElement('div', {
          class: `emby-scroller`,
        });
        indexPage.prepend(container);

        const messageElements = createElement('ul', {
          class: `${cssClassPrefix}-messages`,
        });
        container.prepend(messageElements);

        const url = ApiClient.getUrl('HomeMessage/messages');
        const messages = await ApiClient.getJSON<Message[]>(url);
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          displayMessage(messageElements, message);
        }
      })
      .catch((error: any) => {
        console.error(error);
      });
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
