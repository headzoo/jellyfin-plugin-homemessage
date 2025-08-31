(() => {
  // Jellyfin.Plugin.HomeMessage/Web/js/utils.ts
  var createElement = (tagName, attributes = {}) => {
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

  // Jellyfin.Plugin.HomeMessage/Web/js/home.ts
  (async () => {
    const cssClassPrefix = "home-message";
    const { ApiClient } = window;
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
        btn.addEventListener("click", async () => {
          messageElements.removeChild(messageElement);
          const url = ApiClient.getUrl(`HomeMessage/messages/${message.Id}`);
          await ApiClient.ajax({
            type: "DELETE",
            url
          });
        });
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
    const ready = async (indexPage) => {
      const messageElements = createElement("div", {
        class: `${cssClassPrefix}-messages emby-scroller`
      });
      indexPage.prepend(messageElements);
      const url = ApiClient.getUrl("HomeMessage/messages");
      const messages = await ApiClient.getJSON(url);
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        displayMessage(messageElements, message);
      }
    };
    const boot = async () => {
      const indexPage = document.getElementById("indexPage");
      if (!indexPage) {
        setTimeout(async () => await boot(), 100);
        return;
      }
      await ready(indexPage);
    };
    await boot();
  })();
})();
//# sourceMappingURL=home.js.map
