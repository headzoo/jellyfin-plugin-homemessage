(() => {
  // Jellyfin.Plugin.HomeMessage/Web/js/utils.ts
  function formValuesAll(form) {
    const fd = new FormData(form);
    const obj = {};
    for (const name of new Set(fd.keys())) {
      const all = fd.getAll(name);
      obj[name] = all.length > 1 ? all : all[0];
    }
    return obj;
  }
  function setValue(el, value) {
    if (!el) {
      return;
    }
    el.value = value;
  }

  // Jellyfin.Plugin.HomeMessage/Web/js/ConfigController.ts
  var { ApiClient, Dashboard } = window;
  var _ConfigController = class _ConfigController {
    /**
     * Initializes a new instance of the HomeMessageConfig class.
     */
    constructor() {
      /**
       * Removes all event listeners.
       */
      this.destroy = () => {
        this.configForm.removeEventListener("submit", this.saveConfig);
        const resetBtn = document.getElementById("home-message-reset-btn");
        resetBtn.removeEventListener("click", this.resetConfig);
      };
      /**
       * Loads the configuration from the server.
       */
      this.loadConfig = () => {
        ApiClient.getPluginConfiguration(_ConfigController.pluginUniqueId).then((config) => {
          setValue(this.configForm.querySelector('textarea[name="styles"]'), config.Styles);
          setValue(this.configForm.querySelector('select[name="expiration"]'), config.Expiration);
        });
      };
      /**
       * Saves the configuration to the server.
       *
       * @param e The event.
       */
      this.saveConfig = (e) => {
        e.preventDefault();
        Dashboard.showLoadingMsg();
        ApiClient.getPluginConfiguration(_ConfigController.pluginUniqueId).then((config) => {
          const values = formValuesAll(this.configForm);
          config.Styles = (values.styles || "").toString();
          config.Expiration = (values.expiration || 0).toString();
          ApiClient.updatePluginConfiguration(_ConfigController.pluginUniqueId, config).then(
            (result) => {
              Dashboard.processPluginConfigurationUpdateResult(result);
            }
          );
        });
      };
      /**
       * Resets the configuration to the default values.
       */
      this.resetConfig = () => {
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
          "Are you sure you want to reset the configuration?",
          "Reset Configuration",
          () => {
            setValue(this.configForm.querySelector('textarea[name="styles"]'), styles);
            setValue(this.configForm.querySelector('select[name="expiration"]'), "0");
          }
        );
      };
      const resetBtn = document.getElementById("home-message-reset-btn");
      resetBtn.addEventListener("click", this.resetConfig);
      this.configForm = document.getElementById("home-message-config-form");
      this.configForm.addEventListener("submit", this.saveConfig);
    }
  };
  /**
   * The plugin unique id.
   */
  _ConfigController.pluginUniqueId = "69d36d38-5615-4128-b2e0-30caf4c5ba86";
  var ConfigController = _ConfigController;

  // Jellyfin.Plugin.HomeMessage/Web/js/config.ts
  window.ConfigController = ConfigController;
})();
//# sourceMappingURL=config.js.map
