import { Message, MessageInput } from './@types/Message';
import {
  formValuesAll,
  setHTML,
  setValue,
  setChecked,
  setAttribute,
  paragraphsFromText,
} from './utils';

(async () => {
  const { ApiClient, Dashboard } = window;

  /**
   * Controls the messages page.
   *
   * @see https://github.com/jellyfin-archive/jellyfin-apiclient-javascript
   * @see https://github.com/jellyfin/jellyfin-web/blob/808ece5db48b40bcf841e99c96adf5b8213d77e3/src/utils/dashboard.js#L236
   */
  class MessagesController {
    /**
     * The messages.
     */
    private messages: Message[] = [];

    /**
     * The message form.
     */
    private form!: HTMLFormElement;

    /**
     * The recent background colors list.
     */
    private recentBackgroundColorsList!: HTMLUListElement;

    /**
     * The recent text colors list.
     */
    private recentTextColorsList!: HTMLUListElement;

    /**
     * Initializes a new instance of the HomeMessageConfig class.
     */
    constructor() {
      this.recentBackgroundColorsList = document.getElementById(
        'home-message-recent-colors-list-bg',
      ) as HTMLUListElement;
      this.recentTextColorsList = document.getElementById(
        'home-message-recent-colors-list-text',
      ) as HTMLUListElement;

      this.form = document.getElementById('home-message-message-form') as HTMLFormElement;
      this.form.addEventListener('submit', this.saveMessage);
      this.resetForm();
    }

    /**
     * Loads the existing messages from the server.
     */
    public loadMessages = () => {
      this.ajax('GET', 'config/messages').then((messages: Message[]) => {
        this.messages = messages;
        this.renderMessages();
        this.renderRecentColors();
      });
    };

    /**
     * Creates and updates a message.
     *
     * @param e The event.
     */
    public saveMessage = (e: Event) => {
      e.preventDefault();

      const values = formValuesAll(this.form);
      const message: MessageInput = {
        Title: (values.title || '').toString(),
        Text: (values.message || '').toString(),
        BgColor: (values.bgColor || '').toString(),
        TextColor: (values.textColor || '').toString(),
        Dismissible: (values.dismissible && values.dismissible) === 'on',
        TimeStart: values.timeStart ? new Date(values.timeStart.toString()).getTime() / 1000 : null,
        TimeEnd: values.timeEnd ? new Date(values.timeEnd.toString()).getTime() / 1000 : null,
      };

      this.saveRecentBackgroundColor(message.BgColor);
      this.saveRecentTextColor(message.TextColor);

      const isExisting = !!values.id;
      const url = isExisting ? `config/messages/${values.id}` : 'config/messages';
      this.ajax('POST', url, message).then(() => {
        this.resetForm();
        this.loadMessages();
        Dashboard.alert(isExisting ? 'Message updated' : 'Message added');
      });
    };

    /**
     * Renders the messages.
     */
    private renderMessages = () => {
      const template = document.getElementById('home-message-item-template') as HTMLTemplateElement;
      const messages = document.getElementById('home-message-messages') as HTMLUListElement;
      messages.innerHTML = '';

      for (let i = 0; i < this.messages.length; i++) {
        const message = this.messages[i];
        const createdDate = new Date(message.CreatedTime * 1000);

        const li = template.content.cloneNode(true) as HTMLElement;
        setAttribute(
          li.querySelector('.home-message-messages-item-body'),
          'style',
          `background-color: ${message.BgColor}; color: ${message.TextColor}`,
        );
        setAttribute(li.querySelector('[data-message-id]'), 'data-message-id', message.Id);
        setHTML(li.querySelector('h4'), message.Title);
        setHTML(
          li.querySelector('.home-message-messages-item-text'),
          paragraphsFromText(message.Text),
        );
        setHTML(
          li.querySelector('time'),
          `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`,
        );
        messages.appendChild(li);
      }

      const editBtns = document.getElementsByClassName(
        'home-message-messages-item-heading-edit-btn',
      ) as HTMLCollectionOf<HTMLButtonElement>;
      for (let i = 0; i < editBtns.length; i++) {
        const btn = editBtns[i];
        btn.addEventListener('click', this.editMessage);
      }

      const closeBtns = document.getElementsByClassName(
        'home-message-messages-item-heading-close-btn',
      ) as HTMLCollectionOf<HTMLButtonElement>;
      for (let i = 0; i < closeBtns.length; i++) {
        const btn = closeBtns[i];
        btn.addEventListener('click', this.deleteMessage);
      }
    };

    /**
     * Edits a message.
     *
     * @param e The event.
     */
    private editMessage = (e: Event) => {
      e.preventDefault();

      const btn = e.currentTarget as HTMLButtonElement;
      const parent = btn.closest('[data-message-id]') as HTMLElement;
      const messageId = parent?.dataset.messageId;
      if (!messageId) {
        return;
      }
      const message = this.messages.find((m) => m.Id === messageId);
      if (!message) {
        return;
      }

      this.resetForm();
      const submitBtn = document.querySelector('#home-message-submit-btn span') as HTMLElement;
      submitBtn.textContent = 'Update';

      setValue(this.form.querySelector('input[name="id"]'), message.Id);
      setValue(this.form.querySelector('input[name="title"]'), message.Title);
      setValue(this.form.querySelector('textarea[name="message"]'), message.Text);
      setValue(this.form.querySelector('input[name="bgColor"]'), message.BgColor);
      setValue(this.form.querySelector('input[name="textColor"]'), message.TextColor);
      setChecked(this.form.querySelector('input[name="dismissible"]'), message.Dismissible);

      this.form.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };

    /**
     * Deletes a message.
     *
     * @param e The event.
     */
    private deleteMessage = (e: Event) => {
      e.preventDefault();

      const btn = e.currentTarget as HTMLButtonElement;
      const parent = btn.closest('[data-message-id]') as HTMLElement;
      const messageId = parent?.dataset.messageId;
      if (!messageId) {
        return;
      }

      Dashboard.confirm(
        'Are you sure you want to delete this message?',
        'Delete Message',
        (result) => {
          if (result) {
            this.ajax('DELETE', `config/messages/${messageId}`).then(() => {
              this.loadMessages();
              Dashboard.alert('Message deleted');
            });
          }
        },
      );
    };

    /**
     * Makes an AJAX request.
     *
     * @param method The HTTP method to use.
     * @param path The URL to make the request to.
     * @param data The data to send.
     */
    private ajax = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: any) => {
      Dashboard.showLoadingMsg();
      return await ApiClient.ajax({
        type: method,
        url: ApiClient.getUrl(`HomeMessage/${path}`),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(data),
        headers: {
          accept: 'application/json',
        },
      })
        .catch((error: any) => {
          console.error(error);
          Dashboard.alert(error.toString());
        })
        .finally(() => {
          Dashboard.hideLoadingMsg();
        });
    };

    /**
     * Resets the form.
     */
    private resetForm = () => {
      this.form.reset();
      setValue(this.form.querySelector('input[name="bgColor"]'), '#333333');
      setValue(this.form.querySelector('input[name="textColor"]'), '#ffffff');
      setChecked(this.form.querySelector('input[name="dismissible"]'), true);

      const submitBtn = document.querySelector('#home-message-submit-btn span') as HTMLElement;
      submitBtn.textContent = 'Add';
    };

    /**
     * Renders the recent colors.
     */
    private renderRecentColors = () => {
      const backgroundColors = this.getRecentBackgroundColors();
      const textColors = this.getRecentTextColors();

      this.recentBackgroundColorsList.innerHTML = '';
      if (backgroundColors.length === 0) {
        this.recentBackgroundColorsList.style.display = 'none';
      } else {
        this.recentBackgroundColorsList.style.display = 'block';
        for (let i = 0; i < backgroundColors.length; i++) {
          const color = backgroundColors[i];
          const li = document.createElement('li');
          li.title = 'Select color';
          li.style.backgroundColor = color;
          li.classList.add('home-message-recent-colors-item');
          li.addEventListener('click', () => {
            setValue(this.form.querySelector('input[name="bgColor"]'), color);
          });
          this.recentBackgroundColorsList.appendChild(li);
        }
      }

      this.recentTextColorsList.innerHTML = '';
      if (textColors.length === 0) {
        this.recentTextColorsList.style.display = 'none';
      } else {
        this.recentTextColorsList.style.display = 'block';
        for (let i = 0; i < textColors.length; i++) {
          const color = textColors[i];
          const li = document.createElement('li');
          li.title = 'Select color';
          li.style.backgroundColor = color;
          li.classList.add('home-message-recent-colors-item');
          li.addEventListener('click', () => {
            setValue(this.form.querySelector('input[name="textColor"]'), color);
            this.saveRecentTextColor(color);
          });
          this.recentTextColorsList.appendChild(li);
        }
      }
    };

    /**
     * Adds a color to the list of recently used background colors.
     *
     * Keeps the list to a maximum of 5 colors. Does not include the same color twice.
     *
     * @param color The color to save.
     */
    private saveRecentBackgroundColor = (color: string) => {
      const colors = localStorage.getItem('home-message-recent-background-color');
      if (colors) {
        const colorsList = JSON.parse(colors);
        if (colorsList.includes(color)) {
          return;
        }

        colorsList.unshift(color);
        if (colorsList.length > 5) {
          colorsList.pop();
        }
        localStorage.setItem('home-message-recent-background-color', JSON.stringify(colorsList));
      } else {
        localStorage.setItem('home-message-recent-background-color', JSON.stringify([color]));
      }
    };

    /**
     * Adds a color to the list of recently used text colors.
     *
     * Keeps the list to a maximum of 5 colors. Does not include the same color twice.
     *
     * @param color The color to save.
     */
    private saveRecentTextColor = (color: string) => {
      const colors = localStorage.getItem('home-message-recent-text-color');
      if (colors) {
        const colorsList = JSON.parse(colors);
        if (colorsList.includes(color)) {
          return;
        }

        colorsList.unshift(color);
        if (colorsList.length > 5) {
          colorsList.pop();
        }
        localStorage.setItem('home-message-recent-text-color', JSON.stringify(colorsList));
      } else {
        localStorage.setItem('home-message-recent-text-color', JSON.stringify([color]));
      }
    };

    /**
     * Returns the list of recently used background colors.
     */
    private getRecentBackgroundColors = () => {
      const colors = localStorage.getItem('home-message-recent-background-color');
      if (colors) {
        return JSON.parse(colors);
      }
      return [];
    };

    /**
     * Returns the list of recently used text colors.
     */
    private getRecentTextColors = () => {
      const colors = localStorage.getItem('home-message-recent-text-color');
      if (colors) {
        return JSON.parse(colors);
      }
      return [];
    };
  }

  const c = new MessagesController();
  c.loadMessages();
})();
