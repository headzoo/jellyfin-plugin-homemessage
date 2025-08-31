var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
(() =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { ApiClient } = window;
    /**
     * Displays a message on the home page.
     *
     * @param {HTMLElement} indexPage The #indexPage element.
     * @param {Message} message The message to display.
     */
    const displayMessage = (indexPage, message) => {
      const messageElement = document.createElement('div');
      messageElement.classList.add('home-message-message');
      messageElement.innerText = message.Title;
      messageElement.style.backgroundColor = message.BgColor;
      messageElement.style.color = message.TextColor;
      indexPage.prepend(messageElement);
    };
    /**
     * Called when the page is ready.
     *
     * @param {HTMLElement} indexPage The #indexPage element.
     */
    const ready = (indexPage) =>
      __awaiter(void 0, void 0, void 0, function* () {
        const url = ApiClient.getUrl('HomeMessage/messages');
        const messages = yield ApiClient.getJSON(url);
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          displayMessage(indexPage, message);
        }
      });
    /**
     * Waits for the #indexPage element to be available, then calls ready().
     */
    const boot = () =>
      __awaiter(void 0, void 0, void 0, function* () {
        const indexPage = document.getElementById('indexPage');
        if (!indexPage) {
          setTimeout(
            () =>
              __awaiter(void 0, void 0, void 0, function* () {
                return yield boot();
              }),
            100,
          );
          return;
        }
        yield ready(indexPage);
      });
    yield boot();
  }))();
