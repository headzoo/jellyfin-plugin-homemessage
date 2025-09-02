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
  function setHTML(el, html) {
    if (!el) {
      return;
    }
    el.innerHTML = html;
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
             * Loads the existing messages from the server.
             */
            this.loadMessages = () => {
              this.ajax("GET", "config/messages").then((messages) => {
                this.messages = messages;
                this.renderMessages();
              });
            };
            /**
             * Saves the configuration to the server.
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
              const isExisting = !!values.id;
              const url = isExisting ? `config/messages/${values.id}` : "config/messages";
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
              const messages = document.getElementById("home-message-config-messages");
              messages.innerHTML = "";
              for (let i = 0; i < this.messages.length; i++) {
                const message = this.messages[i];
                const createdDate = new Date(message.CreatedTime * 1e3);
                const li = template.content.cloneNode(true);
                setAttribute(li.querySelector("[data-message-id]"), "data-message-id", message.Id);
                setHTML(li.querySelector("h4"), message.Title);
                setHTML(li.querySelector("p"), message.Text);
                setHTML(
                  li.querySelector("time"),
                  `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`
                );
                messages.appendChild(li);
              }
              const editBtns = document.getElementsByClassName(
                "home-message-config-messages-item-heading-edit-btn"
              );
              for (let i = 0; i < editBtns.length; i++) {
                const btn = editBtns[i];
                btn.addEventListener("click", this.editMessage);
              }
              const closeBtns = document.getElementsByClassName(
                "home-message-config-messages-item-heading-close-btn"
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
              Dashboard.confirm("Are you sure you want to delete this message?", "Delete Message", () => {
                this.ajax("DELETE", `config/messages/${messageId}`).then(() => {
                  this.loadMessages();
                  Dashboard.alert("Message deleted");
                });
              });
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
            this.form = document.getElementById("home-message-config-form");
            this.form.addEventListener("submit", this.saveMessage);
            this.resetForm();
          }
        }
        const config = new HomeMessageConfig();
        config.loadMessages();
      }))();
    }
  });
  require_config();
})();
//# sourceMappingURL=config.js.map
