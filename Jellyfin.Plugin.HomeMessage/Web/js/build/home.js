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
  var createElement;
  var init_utils = __esm({
    "Jellyfin.Plugin.HomeMessage/Web/js/utils.ts"() {
      createElement = (tagName, attributes = {}) => {
        const el = document.createElement(tagName);
        const attr = Object.assign({}, attributes);
        if (attr.html) {
          el.innerHTML = attr.html;
          delete attr.html;
        }
        const keys = Object.keys(attr);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = attr[key];
          el.setAttribute(key, value);
        }
        return el;
      };
    }
  });

  // Jellyfin.Plugin.HomeMessage/Web/js/home.ts
  var require_home = __commonJS({
    "Jellyfin.Plugin.HomeMessage/Web/js/home.ts"(exports) {
      init_utils();
      (() => __async(null, null, function* () {
        const { ApiClient } = window;
        const cssClassPrefix = "home-message";
        const displayMessage = (messageElements, message) => {
          const messageElement = createElement("div", {
            class: `${cssClassPrefix}-message`,
            style: `background-color: ${message.BgColor}; color: ${message.TextColor};`
          });
          if (message.Dismissible) {
            const btn = createElement("button", {
              title: "Close",
              class: `${cssClassPrefix}-dismiss`,
              html: "&times;"
            });
            btn.addEventListener("click", () => __async(null, null, function* () {
              messageElements.removeChild(messageElement);
              const url = ApiClient.getUrl(`HomeMessage/messages/${message.Id}`);
              yield ApiClient.ajax({
                type: "DELETE",
                url
              });
            }));
            messageElement.appendChild(btn);
          }
          const titleElement = createElement("h3", {
            class: `${cssClassPrefix}-title`,
            html: message.Title
          });
          messageElement.appendChild(titleElement);
          const textElement = createElement("p", {
            class: `${cssClassPrefix}-text`,
            html: message.Text
          });
          messageElement.appendChild(textElement);
          messageElements.appendChild(messageElement);
        };
        const ready = (indexPage) => __async(null, null, function* () {
          const messageElements = createElement("div", {
            class: `${cssClassPrefix}-messages emby-scroller`
          });
          indexPage.prepend(messageElements);
          const url = ApiClient.getUrl("HomeMessage/messages");
          const messages = yield ApiClient.getJSON(url);
          for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            displayMessage(messageElements, message);
          }
        });
        const boot = () => __async(null, null, function* () {
          const indexPage = document.getElementById("indexPage");
          if (!indexPage) {
            setTimeout(() => __async(null, null, function* () {
              return yield boot();
            }), 100);
            return;
          }
          yield ready(indexPage);
        });
        yield boot();
      }))();
    }
  });
  require_home();
})();
//# sourceMappingURL=home.js.map
