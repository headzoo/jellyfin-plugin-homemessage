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
    const createdDate = new Date(message.CreatedTime * 1000);
    const messageItem = createElement('li', {
      html: `
        <div
            class="home-message-body"
            style="background-color: ${message.BgColor}; color: ${message.TextColor};"
        >
          ${message.Dismissible ? `<button title="Close" class="home-message-dismiss">&times;</button>` : ''}
          <div class="home-message-title">
            ${message.Title}
          </div>
          <time class="home-message-time">
            ${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}
          </time>
          <div class="home-message-text"></div>
        </div>
        `,
    });

    const text = messageItem.querySelector('.home-message-text') as HTMLDivElement;
    if (text) {
      text.appendChild(paragraphsFromText(message.Text));
    }

    if (message.Dismissible) {
      const btn = messageItem.querySelector('.home-message-dismiss') as HTMLButtonElement;
      btn.addEventListener('click', async () => {
        messageElements.removeChild(messageItem);
        const url = ApiClient.getUrl(`HomeMessage/messages/${message.Id}`);
        await ApiClient.ajax({
          type: 'DELETE',
          url,
        });
      });
    }

    messageElements.appendChild(messageItem);
  };

  /**
   * Called when the page is ready.
   *
   * @param indexPage The #indexPage element.
   */
  const ready = async (indexPage: HTMLElement) => {
    ApiClient.getPluginConfiguration(pluginUniqueId)
      .then(async (config: any) => {
        // Adds configured styles to the document.
        const styles = config.Styles || '';
        if (styles) {
          const style = document.createElement('style');
          style.innerHTML = styles;
          document.head.appendChild(style);
        }

        // Creates a container for the messages.
        const container = createElement('div', {
          class: `emby-scroller`,
        });
        indexPage.prepend(container);
        const messageElements = createElement('ul', {
          class: `${cssClassPrefix}-messages`,
        });
        container.prepend(messageElements);

        // Loads the messages from the server.
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
