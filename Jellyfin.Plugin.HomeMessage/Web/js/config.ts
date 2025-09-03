import { Config } from './@types/Config';
import { formValuesAll, setValue } from './utils';

(async () => {
  // @ts-ignore
  const { ApiClient, Dashboard } = window;

  /**
   * The configuration page.
   */
  class HomeMessageConfig {
    /**
     * The plugin unique id.
     */
    public static pluginUniqueId = '69d36d38-5615-4128-b2e0-30caf4c5ba86';

    /**
     * The config form.
     */
    private configForm!: HTMLFormElement;

    /**
     * Initializes a new instance of the HomeMessageConfig class.
     */
    constructor() {
      this.configForm = document.getElementById('home-message-config-form') as HTMLFormElement;
      this.configForm.addEventListener('submit', this.saveConfig);
      this.loadConfig();

      const resetBtn = document.getElementById('home-message-reset-btn') as HTMLButtonElement;
      resetBtn.addEventListener('click', this.resetConfig);
    }

    /**
     * Resets the configuration to the default values.
     */
    public resetConfig = () => {
      const styles = `
/* Wraps each message. */
.home-message-body {

}

/* The message title. */
.home-message-title {

}

/* The message time. */
.home-message-time {

}

/* The message text. */
.home-message-text p {

}
      `.trim();

      Dashboard.confirm(
        'Are you sure you want to reset the configuration?',
        'Reset Configuration',
        () => {
          setValue(this.configForm.querySelector('textarea[name="styles"]'), styles);
          setValue(this.configForm.querySelector('select[name="expiration"]'), '0');
        },
      );
    };

    /**
     * Saves the configuration to the server.
     *
     * @param e The event.
     */
    public saveConfig = (e: Event) => {
      e.preventDefault();

      Dashboard.showLoadingMsg();
      ApiClient.getPluginConfiguration(HomeMessageConfig.pluginUniqueId).then((config: Config) => {
        const values = formValuesAll(this.configForm);
        config.Styles = (values.styles || '').toString();
        config.Expiration = (values.expiration || 0).toString();
        ApiClient.updatePluginConfiguration(HomeMessageConfig.pluginUniqueId, config).then(
          (result: any) => {
            Dashboard.processPluginConfigurationUpdateResult(result);
          },
        );
      });
    };

    /**
     * Loads the configuration from the server.
     */
    public loadConfig = () => {
      ApiClient.getPluginConfiguration(HomeMessageConfig.pluginUniqueId).then((config: Config) => {
        setValue(this.configForm.querySelector('textarea[name="styles"]'), config.Styles);
        setValue(this.configForm.querySelector('select[name="expiration"]'), config.Expiration);
      });
    };
  }

  const config = new HomeMessageConfig();
  config.loadConfig();
})();
