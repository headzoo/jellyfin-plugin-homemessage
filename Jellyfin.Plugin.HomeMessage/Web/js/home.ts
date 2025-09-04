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
      role: 'note',
      class: `${cssClassPrefix}-item`,
      'aria-labelledby': `${cssClassPrefix}-message-${message.Id}`,
      'aria-describedby': `${cssClassPrefix}-description-${message.Id}`,
      html: `
        <div
            class="${cssClassPrefix}-body"
            style="background-color: ${message.BgColor}; color: ${message.TextColor};"
        >
          ${message.Dismissible ? `<button title="Close" type="button" aria-label="Dismiss announcement" class="${cssClassPrefix}-dismiss"><span aria-hidden="true">&times;</span></button>` : ''}
          <div id="${cssClassPrefix}-message-${message.Id}" class="${cssClassPrefix}-title">
            ${message.Title}
          </div>
          <time class="${cssClassPrefix}-time">
            ${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}
          </time>
          <div id="${cssClassPrefix}-description-${message.Id}" class="${cssClassPrefix}-text"></div>
        </div>
        `,
    });

    const text = messageItem.querySelector(`.${cssClassPrefix}-text`) as HTMLDivElement;
    if (text) {
      text.appendChild(paragraphsFromText(message.Text));
    }

    if (message.Dismissible) {
      const btn = messageItem.querySelector(`.${cssClassPrefix}-dismiss`) as HTMLButtonElement;
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

        const section = createElement('section', {
          class: `${cssClassPrefix}-section`,
          role: 'region',
          'aria-label': 'Announcements',
          'aria-live': 'polite',
        });
        container.prepend(section);

        const messageElements = createElement('ul', {
          class: `${cssClassPrefix}-messages`,
          role: 'list',
        });
        section.prepend(messageElements);

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
