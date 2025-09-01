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
        class HomeMessageConfig {
          /**
           * Initializes a new instance of the HomeMessageConfig class.
           */
          constructor() {
            /**
             * The messages.
             */
            this.messages = [];
            /**
             * Loads the configuration from the server.
             */
            this.loadConfig = () => {
              Dashboard.showLoadingMsg();
              const url = ApiClient.getUrl(`HomeMessage/config`);
              ApiClient.getJSON(url).then((messages) => {
                this.messages = messages;
              }).catch((error) => {
                console.error(error);
              }).finally(() => {
                Dashboard.hideLoadingMsg();
              });
            };
            /**
             * Saves the configuration to the server.
             */
            this.saveConfig = (e) => {
              e.preventDefault();
              Dashboard.showLoadingMsg();
              const form = e.currentTarget;
              const values = formValuesAll(form);
              const message = {
                Title: (values.title || "").toString(),
                Text: (values.message || "").toString(),
                BgColor: (values.bgColor || "").toString(),
                TextColor: (values.textColor || "").toString(),
                Dismissible: (values.dismissible && values.dismissible) === "on",
                TimeStart: null,
                TimeEnd: null
              };
              const url = ApiClient.getUrl(`HomeMessage/config`);
              ApiClient.ajax({
                type: "POST",
                url,
                data: JSON.stringify(message),
                contentType: "application/json"
              }).then(Dashboard.processPluginConfigurationUpdateResult).then(() => {
                form.reset();
              }).catch((error) => {
                console.error(error);
              }).finally(() => {
                Dashboard.hideLoadingMsg();
              });
            };
            const form = document.getElementById("home-message-form");
            form.addEventListener("submit", this.saveConfig);
          }
        }
        const config = new HomeMessageConfig();
        config.loadConfig();
      }))();
    }
  });
  require_config();
})();
//# sourceMappingURL=config.js.map
