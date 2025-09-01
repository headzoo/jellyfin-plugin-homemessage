import { Message, MessageInput } from './@types/Message';
import { formValuesAll } from './utils';

(async () => {
  const { ApiClient, Dashboard } = window;

  class HomeMessageConfig {
    /**
     * The messages.
     */
    private messages: Message[] = [];

    /**
     * Initializes a new instance of the HomeMessageConfig class.
     */
    constructor() {
      const form = document.getElementById('home-message-form') as HTMLFormElement;
      form.addEventListener('submit', this.saveConfig);
    }

    /**
     * Loads the configuration from the server.
     */
    public loadConfig = () => {
      Dashboard.showLoadingMsg();

      const url = ApiClient.getUrl(`HomeMessage/config`);
      ApiClient.getJSON<Message[]>(url)
        .then((messages: Message[]) => {
          this.messages = messages;
        })
        .catch((error: any) => {
          console.error(error);
        })
        .finally(() => {
          Dashboard.hideLoadingMsg();
        });
    };

    /**
     * Saves the configuration to the server.
     */
    public saveConfig = (e: Event) => {
      e.preventDefault();

      Dashboard.showLoadingMsg();

      const form = e.currentTarget as HTMLFormElement;
      const values = formValuesAll(form);
      const message: MessageInput = {
        Title: (values.title || '').toString(),
        Text: (values.message || '').toString(),
        BgColor: (values.bgColor || '').toString(),
        TextColor: (values.textColor || '').toString(),
        Dismissible: (values.dismissible && values.dismissible) === 'on',
        TimeStart: null,
        TimeEnd: null,
      };

      const url = ApiClient.getUrl(`HomeMessage/config`);
      ApiClient.ajax({
        type: 'POST',
        url,
        data: JSON.stringify(message),
        contentType: 'application/json',
      })
        .then(Dashboard.processPluginConfigurationUpdateResult)
        .then(() => {
          form.reset();
        })
        .catch((error: any) => {
          console.error(error);
        })
        .finally(() => {
          Dashboard.hideLoadingMsg();
        });
    };
  }

  const config = new HomeMessageConfig();
  config.loadConfig();
})();
