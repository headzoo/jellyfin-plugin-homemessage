(() => {
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
  function setValue(el, value) {
    if (!el) {
      return;
    }
    el.value = value;
  }
  function setChecked(el, checked) {
    if (!el) {
      return;
    }
    el.checked = checked;
  }
  function setAttribute(el, name, value) {
    if (!el) {
      return;
    }
    el.setAttribute(name, value);
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

  // Jellyfin.Plugin.HomeMessage/Web/js/MessagesController.ts
  var { ApiClient, Dashboard } = window;
  var MessagesController = class {
    /**
     * Initializes a new instance of the HomeMessageConfig class.
     */
    constructor() {
      /**
       * The messages.
       */
      this.messages = [];
      /**
       * Loads the existing messages from the server.
       */
      this.loadMessages = () => {
        this.ajax("GET", "admin/messages").then((messages) => {
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
      this.saveMessage = (e) => {
        e.preventDefault();
        const values = formValuesAll(this.form);
        const message = {
          Title: (values.title || "").toString(),
          Text: (values.message || "").toString(),
          BgColor: (values.bgColor || "").toString(),
          TextColor: (values.textColor || "").toString(),
          Dismissible: (values.dismissible && values.dismissible) === "on",
          TimeStart: values.timeStart ? new Date(values.timeStart.toString()).getTime() / 1e3 : null,
          TimeEnd: values.timeEnd ? new Date(values.timeEnd.toString()).getTime() / 1e3 : null
        };
        this.saveRecentBackgroundColor(message.BgColor);
        this.saveRecentTextColor(message.TextColor);
        const isExisting = !!values.id;
        const url = isExisting ? `admin/messages/${values.id}` : "admin/messages";
        this.ajax("POST", url, message).then(() => {
          this.resetForm();
          this.loadMessages();
          Dashboard.alert(isExisting ? "Message updated" : "Message added");
        });
      };
      /**
       * Renders the messages.
       */
      this.renderMessages = () => {
        const template = document.getElementById("home-message-item-template");
        const messages = document.getElementById("home-message-messages");
        messages.innerHTML = "";
        for (let i = 0; i < this.messages.length; i++) {
          const message = this.messages[i];
          const createdDate = new Date(message.CreatedTime * 1e3);
          const li = template.content.cloneNode(true);
          setAttribute(
            li.querySelector(".home-message-messages-item-body"),
            "style",
            `background-color: ${message.BgColor}; color: ${message.TextColor}`
          );
          setAttribute(li.querySelector("[data-message-id]"), "data-message-id", message.Id);
          setHTML(li.querySelector("h4"), message.Title);
          setHTML(
            li.querySelector(".home-message-messages-item-text"),
            paragraphsFromText(message.Text)
          );
          setHTML(
            li.querySelector("time"),
            `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`
          );
          messages.appendChild(li);
        }
        const editBtns = document.getElementsByClassName(
          "home-message-messages-item-heading-edit-btn"
        );
        for (let i = 0; i < editBtns.length; i++) {
          const btn = editBtns[i];
          btn.addEventListener("click", this.editMessage);
        }
        const closeBtns = document.getElementsByClassName(
          "home-message-messages-item-heading-close-btn"
        );
        for (let i = 0; i < closeBtns.length; i++) {
          const btn = closeBtns[i];
          btn.addEventListener("click", this.deleteMessage);
        }
      };
      /**
       * Edits a message.
       *
       * @param e The event.
       */
      this.editMessage = (e) => {
        e.preventDefault();
        const btn = e.currentTarget;
        const parent = btn.closest("[data-message-id]");
        const messageId = parent == null ? void 0 : parent.dataset.messageId;
        if (!messageId) {
          return;
        }
        const message = this.messages.find((m) => m.Id === messageId);
        if (!message) {
          return;
        }
        this.resetForm();
        const submitBtn = document.querySelector("#home-message-submit-btn span");
        submitBtn.textContent = "Update";
        setValue(this.form.querySelector('input[name="id"]'), message.Id);
        setValue(this.form.querySelector('input[name="title"]'), message.Title);
        setValue(this.form.querySelector('textarea[name="message"]'), message.Text);
        setValue(this.form.querySelector('input[name="bgColor"]'), message.BgColor);
        setValue(this.form.querySelector('input[name="textColor"]'), message.TextColor);
        setChecked(this.form.querySelector('input[name="dismissible"]'), message.Dismissible);
        this.form.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      };
      /**
       * Deletes a message.
       *
       * @param e The event.
       */
      this.deleteMessage = (e) => {
        e.preventDefault();
        const btn = e.currentTarget;
        const parent = btn.closest("[data-message-id]");
        const messageId = parent == null ? void 0 : parent.dataset.messageId;
        if (!messageId) {
          return;
        }
        Dashboard.confirm(
          "Are you sure you want to delete this message?",
          "Delete Message",
          (result) => {
            if (result) {
              this.ajax("DELETE", `admin/messages/${messageId}`).then(() => {
                this.loadMessages();
                Dashboard.alert("Message deleted");
              });
            }
          }
        );
      };
      /**
       * Makes an AJAX request.
       *
       * @param method The HTTP method to use.
       * @param path The URL to make the request to.
       * @param data The data to send.
       */
      this.ajax = (method, path, data) => __async(null, null, function* () {
        Dashboard.showLoadingMsg();
        return yield ApiClient.ajax({
          type: method,
          url: ApiClient.getUrl(`HomeMessage/${path}`),
          dataType: "json",
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify(data),
          headers: {
            accept: "application/json"
          }
        }).catch((error) => {
          console.error(error);
          Dashboard.alert(error.toString());
        }).finally(() => {
          Dashboard.hideLoadingMsg();
        });
      });
      /**
       * Resets the form.
       */
      this.resetForm = () => {
        this.form.reset();
        setValue(this.form.querySelector('input[name="bgColor"]'), "#333333");
        setValue(this.form.querySelector('input[name="textColor"]'), "#ffffff");
        setChecked(this.form.querySelector('input[name="dismissible"]'), true);
        const submitBtn = document.querySelector("#home-message-submit-btn span");
        submitBtn.textContent = "Add";
      };
      /**
       * Renders the recent colors.
       */
      this.renderRecentColors = () => {
        const backgroundColors = this.getRecentBackgroundColors();
        const textColors = this.getRecentTextColors();
        this.recentBackgroundColorsList.innerHTML = "";
        if (backgroundColors.length === 0) {
          this.recentBackgroundColorsList.style.display = "none";
        } else {
          this.recentBackgroundColorsList.style.display = "block";
          for (let i = 0; i < backgroundColors.length; i++) {
            const color = backgroundColors[i];
            const li = document.createElement("li");
            li.title = "Select color";
            li.style.backgroundColor = color;
            li.classList.add("home-message-recent-colors-item");
            li.addEventListener("click", () => {
              setValue(this.form.querySelector('input[name="bgColor"]'), color);
            });
            this.recentBackgroundColorsList.appendChild(li);
          }
        }
        this.recentTextColorsList.innerHTML = "";
        if (textColors.length === 0) {
          this.recentTextColorsList.style.display = "none";
        } else {
          this.recentTextColorsList.style.display = "block";
          for (let i = 0; i < textColors.length; i++) {
            const color = textColors[i];
            const li = document.createElement("li");
            li.title = "Select color";
            li.style.backgroundColor = color;
            li.classList.add("home-message-recent-colors-item");
            li.addEventListener("click", () => {
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
      this.saveRecentBackgroundColor = (color) => {
        const colors = localStorage.getItem("home-message-recent-background-color");
        if (colors) {
          const colorsList = JSON.parse(colors);
          if (colorsList.includes(color)) {
            return;
          }
          colorsList.unshift(color);
          if (colorsList.length > 5) {
            colorsList.pop();
          }
          localStorage.setItem("home-message-recent-background-color", JSON.stringify(colorsList));
        } else {
          localStorage.setItem("home-message-recent-background-color", JSON.stringify([color]));
        }
      };
      /**
       * Adds a color to the list of recently used text colors.
       *
       * Keeps the list to a maximum of 5 colors. Does not include the same color twice.
       *
       * @param color The color to save.
       */
      this.saveRecentTextColor = (color) => {
        const colors = localStorage.getItem("home-message-recent-text-color");
        if (colors) {
          const colorsList = JSON.parse(colors);
          if (colorsList.includes(color)) {
            return;
          }
          colorsList.unshift(color);
          if (colorsList.length > 5) {
            colorsList.pop();
          }
          localStorage.setItem("home-message-recent-text-color", JSON.stringify(colorsList));
        } else {
          localStorage.setItem("home-message-recent-text-color", JSON.stringify([color]));
        }
      };
      /**
       * Returns the list of recently used background colors.
       */
      this.getRecentBackgroundColors = () => {
        const colors = localStorage.getItem("home-message-recent-background-color");
        if (colors) {
          return JSON.parse(colors);
        }
        return [];
      };
      /**
       * Returns the list of recently used text colors.
       */
      this.getRecentTextColors = () => {
        const colors = localStorage.getItem("home-message-recent-text-color");
        if (colors) {
          return JSON.parse(colors);
        }
        return [];
      };
      this.recentBackgroundColorsList = document.getElementById(
        "home-message-recent-colors-list-bg"
      );
      this.recentTextColorsList = document.getElementById(
        "home-message-recent-colors-list-text"
      );
      this.form = document.getElementById("home-message-message-form");
      this.form.addEventListener("submit", this.saveMessage);
      this.resetForm();
    }
  };

  // Jellyfin.Plugin.HomeMessage/Web/js/messages.ts
  var c = new MessagesController();
  c.loadMessages();
})();
//# sourceMappingURL=messages.js.map
