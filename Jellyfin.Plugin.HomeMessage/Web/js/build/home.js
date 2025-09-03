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
  function setHTML(el, html) {
    if (!el) {
      return;
    }
    if (typeof html === "string") {
      el.innerHTML = html;
      return;
    }
    if (Array.isArray(html)) {
      el.innerHTML = "";
      for (let i = 0; i < html.length; i++) {
        el.appendChild(html[i]);
      }
      return;
    }
    el.innerHTML = "";
    el.appendChild(html);
  }
  function paragraphsFromText(text, opts = {}) {
    const { mode = "blankLineIsParagraph", keepEmpty = false, className, doc = document } = opts;
    const frag = doc.createDocumentFragment();
    if (text == null) return frag;
    const normalized = String(text).replace(/\r\n?/g, "\n");
    const chunks = mode === "everyLineIsParagraph" ? normalized.split("\n") : normalized.split(/\n{2,}/);
    for (const raw of chunks) {
      const paraText = mode === "everyLineIsParagraph" ? raw : raw.replace(/\n+$/g, "");
      if (!keepEmpty && /^\s*$/.test(paraText)) continue;
      const p = doc.createElement("p");
      if (className) p.className = className;
      if (mode === "everyLineIsParagraph") {
        p.appendChild(doc.createTextNode(paraText));
      } else {
        const lines = paraText.split("\n");
        lines.forEach((line, i) => {
          if (i > 0) p.appendChild(doc.createElement("br"));
          p.appendChild(doc.createTextNode(line));
        });
      }
      frag.appendChild(p);
    }
    return frag;
  }
  var createElement;
  var init_utils = __esm({
    "Jellyfin.Plugin.HomeMessage/Web/js/utils.ts"() {
      createElement = (tagName, attributes = {}) => {
        const el = document.createElement(tagName);
        const attr = Object.assign({}, attributes);
        if (attr.html) {
          setHTML(el, attr.html);
          delete attr.html;
        }
        const keys = Object.keys(attr);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = attr[key];
          if (typeof value === "string") {
            el.setAttribute(key, value);
          }
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
        const pluginUniqueId = "69d36d38-5615-4128-b2e0-30caf4c5ba86";
        const displayMessage = (messageElements, message) => {
          const messageItem = createElement("li");
          messageElements.appendChild(messageItem);
          const messageBody = createElement("div", {
            class: `${cssClassPrefix}-body`,
            style: `background-color: ${message.BgColor}; color: ${message.TextColor};`
          });
          messageItem.appendChild(messageBody);
          if (message.Dismissible) {
            const btn = createElement("button", {
              title: "Close",
              class: `${cssClassPrefix}-dismiss`,
              html: "&times;"
            });
            btn.addEventListener("click", () => __async(null, null, function* () {
              messageElements.removeChild(messageBody);
              const url = ApiClient.getUrl(`HomeMessage/messages/${message.Id}`);
              yield ApiClient.ajax({
                type: "DELETE",
                url
              });
            }));
            messageBody.appendChild(btn);
          }
          const titleElement = createElement("h3", {
            class: `${cssClassPrefix}-title`,
            html: message.Title
          });
          messageBody.appendChild(titleElement);
          const createdDate = new Date(message.CreatedTime * 1e3);
          const timeElement = createElement("time", {
            class: `${cssClassPrefix}-time`,
            html: `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`
          });
          messageBody.appendChild(timeElement);
          const textElement = createElement("div", {
            class: `${cssClassPrefix}-text`,
            html: paragraphsFromText(message.Text)
          });
          messageBody.appendChild(textElement);
        };
        const ready = (indexPage) => __async(null, null, function* () {
          ApiClient.getPluginConfiguration(pluginUniqueId).then((config) => __async(null, null, function* () {
            const styles = config.Styles || "";
            if (styles) {
              const style = document.createElement("style");
              style.innerHTML = styles;
              document.head.appendChild(style);
            }
            const container = createElement("div", {
              class: `emby-scroller`
            });
            indexPage.prepend(container);
            const messageElements = createElement("ul", {
              class: `${cssClassPrefix}-messages`
            });
            container.prepend(messageElements);
            const url = ApiClient.getUrl("HomeMessage/messages");
            const messages = yield ApiClient.getJSON(url);
            for (let i = 0; i < messages.length; i++) {
              const message = messages[i];
              displayMessage(messageElements, message);
            }
          })).catch((error) => {
            console.error(error);
          });
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
