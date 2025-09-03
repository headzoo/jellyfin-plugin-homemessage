(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

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
  var init_utils = __esm({
    "Jellyfin.Plugin.HomeMessage/Web/js/utils.ts"() {
    }
  });

  // Jellyfin.Plugin.HomeMessage/Web/js/config.ts
  var require_config = __commonJS({
    "Jellyfin.Plugin.HomeMessage/Web/js/config.ts"(exports) {
      init_utils();
      (() => __async(null, null, function* () {
        const { ApiClient, Dashboard } = window;
        const _ConfigController = class _ConfigController {
          /**
           * Initializes a new instance of the HomeMessageConfig class.
           */
          constructor() {
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
             * Loads the configuration from the server.
             */
            this.loadConfig = () => {
              ApiClient.getPluginConfiguration(_ConfigController.pluginUniqueId).then((config) => {
                setValue(this.configForm.querySelector('textarea[name="styles"]'), config.Styles);
                setValue(this.configForm.querySelector('select[name="expiration"]'), config.Expiration);
              });
            };
            const resetBtn = document.getElementById("home-message-reset-btn");
            resetBtn.addEventListener("click", this.resetConfig);
            this.configForm = document.getElementById("home-message-config-form");
            this.configForm.addEventListener("submit", this.saveConfig);
            this.loadConfig();
          }
        };
        /**
         * The plugin unique id.
         */
        _ConfigController.pluginUniqueId = "69d36d38-5615-4128-b2e0-30caf4c5ba86";
        let ConfigController = _ConfigController;
        const c = new ConfigController();
        c.loadConfig();
      }))();
    }
  });
  require_config();
})();
//# sourceMappingURL=config.js.map
