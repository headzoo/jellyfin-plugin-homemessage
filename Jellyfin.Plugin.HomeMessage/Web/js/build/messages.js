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

  // Jellyfin.Plugin.HomeMessage/Web/js/TinyEditor.ts
  var TinyEditor = class {
    /**
     * Constructs a new TinyEditor instance.
     *
     * @param root The root input element.
     * @param rootToolbar The root toolbar element.
     * @param options The options.
     */
    constructor(root, rootToolbar, options = {}) {
      /**
       * Saved selection range.
       */
      this.savedRange = null;
      /**
       * Focuses the editor.
       */
      this.focus = () => {
        this.editable.focus();
      };
      /**
       * Sets the HTML content of the editor.
       *
       * @param html The HTML content.
       */
      this.setHTML = (html) => {
        const clean = this.cleanHTML(html);
        this.editable.innerHTML = clean || "";
        this.togglePlaceholder();
      };
      /**
       * Gets the HTML content of the editor.
       *
       * Returns normalized & sanitized HTML.
       */
      this.getHTML = () => {
        return this.cleanHTML(this.editable.innerHTML);
      };
      /**
       * Destroys the editor.
       */
      this.destroy = () => {
        document.removeEventListener("selectionchange", this.onSelectionChange);
        this.editable.removeEventListener("keydown", this.onKeydown);
        this.editable.removeEventListener("input", this.onInput);
        this.editable.removeEventListener("paste", this.onPaste);
        this.root.innerHTML = "";
      };
      /**
       * Mounts the editor.
       */
      this.mount = () => {
        var _a;
        this.root.classList.add("hm-te");
        if (this.opt.toolbar) {
          this.toolbarEl = this.buildToolbar();
          this.rootToolbar.innerHTML = "";
          this.rootToolbar.appendChild(this.toolbarEl);
        }
        this.editable = document.createElement("div");
        this.editable.className = "hm-te-editable";
        this.editable.contentEditable = "true";
        if (this.opt.placeholder) {
          this.editable.setAttribute("data-placeholder", this.opt.placeholder);
        }
        this.root.appendChild(this.editable);
        this.root.addEventListener("click", (e) => {
          if (e.target === this.editable || this.editable.contains(e.target)) {
            return;
          }
          if (this.toolbarEl && this.toolbarEl.contains(e.target)) {
            return;
          }
          this.editable.focus();
          const range = document.createRange();
          range.selectNodeContents(this.editable);
          range.collapse(false);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        });
        document.addEventListener("selectionchange", this.onSelectionChange);
        this.editable.addEventListener("keydown", this.onKeydown);
        this.editable.addEventListener("input", this.onInput);
        this.editable.addEventListener("paste", this.onPaste);
        const initial = (_a = this.opt.initialHTML) != null ? _a : "";
        if (initial) {
          this.setHTML(initial);
        } else {
          this.togglePlaceholder();
        }
      };
      /**
       * Builds the toolbar.
       */
      this.buildToolbar = () => {
        const tb = document.createElement("div");
        tb.className = "hm-te-toolbar";
        const mkBtn = (label, title, cmd, extra) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "hm-te-btn emby-button raised";
          b.textContent = label;
          b.title = title;
          b.setAttribute("aria-pressed", "false");
          b.addEventListener("mousedown", (e) => e.preventDefault());
          b.addEventListener("click", (e) => {
            this.editable.focus();
            if (extra) extra(e);
            else this.exec(cmd);
          });
          b.dataset.cmd = cmd;
          return b;
        };
        const bBold = mkBtn("B", "Bold (Ctrl/Cmd+B)", "bold");
        bBold.style.fontWeight = "bold";
        const bItalic = mkBtn("I", "Italic (Ctrl/Cmd+I)", "italic");
        bItalic.style.fontStyle = "italic";
        const bUnderline = mkBtn("U", "Underline (Ctrl/Cmd+U)", "underline");
        bUnderline.style.textDecoration = "underline";
        const bStrike = mkBtn("S", "Strikethrough (Ctrl/Cmd+Shift+S)", "strikeThrough");
        bStrike.style.textDecoration = "line-through";
        const bLink = mkBtn(
          "\u{1F517}",
          "Add or edit link (Ctrl/Cmd+K)",
          "createlink",
          () => this.handleLink()
        );
        const bUnlink = mkBtn("\u26D3\uFE0F", "Remove link", "unlink", () => this.exec("unlink"));
        tb.append(bBold, bItalic, bUnderline, bStrike, bLink, bUnlink);
        return tb;
      };
      /**
       * Executes a command.
       *
       * @param cmd The command to execute.
       * @param value The value to pass to the command.
       */
      this.exec = (cmd, value) => {
        if (!this.isSelectionInEditor()) {
          return;
        }
        document.execCommand(cmd, false, value);
        if (cmd === "createLink") {
          this.ensureLinkAttrs();
        }
        this.updateToolbarState();
        this.emitChange();
      };
      /**
       * Handles a link.
       */
      this.handleLink = () => {
        if (!this.isSelectionInEditor()) {
          return;
        }
        const a = this.closestAnchor();
        const current = (a == null ? void 0 : a.getAttribute("href")) || "";
        this.saveSelection();
        const url = window.prompt("Link URL (http(s)://, mailto:, tel:)", current || "https://");
        this.restoreSelection();
        if (!url) {
          return;
        }
        if (a) {
          if (this.isSafeUrl(url)) {
            a.setAttribute("href", url);
            this.applyLinkTargetRel(a);
          } else {
            this.unwrapNode(a);
          }
        } else {
          const sel = window.getSelection();
          if (!sel) {
            return;
          }
          if (sel.isCollapsed) {
            document.execCommand("insertText", false, url);
            const r = sel.getRangeAt(0);
            r.setStart(r.startContainer, Math.max(0, r.startOffset - url.length));
            sel.removeAllRanges();
            sel.addRange(r);
          }
          document.execCommand("createLink", false, url);
          this.ensureLinkAttrs();
        }
        this.emitChange();
      };
      /**
       * Ensures link attributes.
       */
      this.ensureLinkAttrs = () => {
        const anchors = this.getAnchorsInSelectionOrParent();
        anchors.forEach((a) => this.applyLinkTargetRel(a));
      };
      /**
       * Applies link target/rel attributes.
       *
       * @param a The anchor element.
       */
      this.applyLinkTargetRel = (a) => {
        const href = a.getAttribute("href") || "";
        if (!this.isSafeUrl(href)) {
          this.unwrapNode(a);
          return;
        }
        if (this.opt.targetBlank) {
          a.setAttribute("target", "_blank");
        }
        const rel = this.opt.rel.trim();
        if (rel) {
          a.setAttribute("rel", rel);
        }
      };
      /**
       * Checks if a URL is safe.
       *
       * @param url The URL to check.
       */
      this.isSafeUrl = (url) => {
        try {
          const u = new URL(url, window.location.origin);
          const scheme = u.protocol.replace(":", "").toLowerCase();
          return ["http", "https", "mailto", "tel"].includes(scheme);
        } catch (e) {
          return !/^\s*javascript:/i.test(url);
        }
      };
      /**
       * Handles keydown events.
       *
       * @param e The event.
       */
      this.onKeydown = (e) => {
        const meta = e.ctrlKey || e.metaKey;
        if (!meta) {
          return;
        }
        const key = e.key.toLowerCase();
        if (key === "b") {
          e.preventDefault();
          this.exec("bold");
        } else if (key === "i") {
          e.preventDefault();
          this.exec("italic");
        } else if (key === "k") {
          e.preventDefault();
          this.handleLink();
        } else if (key === "s" && e.shiftKey) {
          e.preventDefault();
          this.exec("strikeThrough");
        }
      };
      /**
       * Handles input events.
       */
      this.onInput = () => {
        this.togglePlaceholder();
        this.emitChange();
      };
      /**
       * Handles paste events.
       *
       * @param e The event.
       */
      this.onPaste = (e) => {
        var _a, _b;
        e.preventDefault();
        const text = (_b = (_a = e.clipboardData) == null ? void 0 : _a.getData("text/plain")) != null ? _b : "";
        document.execCommand("insertText", false, text);
      };
      /**
       * Handles selection change events.
       */
      this.onSelectionChange = () => {
        if (!this.isSelectionInEditor() || !this.toolbarEl) {
          return;
        }
        this.updateToolbarState();
      };
      /**
       * Updates the toolbar state.
       */
      this.updateToolbarState = () => {
        if (!this.toolbarEl) {
          return;
        }
        const states = {
          // eslint-disable-next-line deprecation/deprecation
          bold: document.queryCommandState("bold"),
          // eslint-disable-next-line deprecation/deprecation
          italic: document.queryCommandState("italic"),
          // eslint-disable-next-line deprecation/deprecation
          strikeThrough: document.queryCommandState("strikeThrough")
        };
        this.toolbarEl.querySelectorAll(".hm-te-btn").forEach((btn) => {
          const cmd = btn.dataset.cmd || "";
          const active = states[cmd] || cmd === "createlink" && !!this.closestAnchor();
          btn.setAttribute("aria-pressed", active ? "true" : "false");
        });
      };
      /**
       * Emits a change event.
       */
      this.emitChange = () => {
        if (this.opt.onChange) {
          this.opt.onChange(this.getHTML());
        }
      };
      /**
       * Toggles the placeholder.
       */
      this.togglePlaceholder = () => {
        var _a, _b;
        if (!this.opt.placeholder) {
          return;
        }
        const text = (_b = (_a = this.editable.textContent) == null ? void 0 : _a.trim()) != null ? _b : "";
        if (text.length === 0 && this.editable.innerHTML.replace(/<br\s*\/?>/gi, "").trim() === "") {
          this.editable.setAttribute("data-empty", "true");
        } else {
          this.editable.removeAttribute("data-empty");
        }
      };
      /**
       * Checks if the selection is in the editor.
       */
      this.isSelectionInEditor = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          return false;
        }
        const { anchorNode, focusNode } = sel;
        return !!(anchorNode && this.editable.contains(anchorNode)) || !!(focusNode && this.editable.contains(focusNode));
      };
      /**
       * Saves the selection.
       */
      this.saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          this.savedRange = sel.getRangeAt(0).cloneRange();
        }
      };
      /**
       * Restores the selection.
       */
      this.restoreSelection = () => {
        if (!this.savedRange) {
          return;
        }
        const sel = window.getSelection();
        if (!sel) {
          return;
        }
        sel.removeAllRanges();
        sel.addRange(this.savedRange);
        this.savedRange = null;
      };
      /**
       * Gets the closest anchor element.
       */
      this.closestAnchor = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          return null;
        }
        let node = sel.anchorNode;
        while (node && node !== this.editable) {
          if (node instanceof HTMLAnchorElement) return node;
          node = node.parentNode;
        }
        return null;
      };
      /**
       * Gets the anchors in the selection or parent.
       */
      this.getAnchorsInSelectionOrParent = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          return [];
        }
        const r = sel.getRangeAt(0);
        const container = r.commonAncestorContainer instanceof Element ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
        if (!container) {
          return [];
        }
        const anchors = /* @__PURE__ */ new Set();
        const a = this.closestAnchor();
        if (a) {
          anchors.add(a);
        }
        container.querySelectorAll("a").forEach((el) => {
          const rects = el.getClientRects();
          if (rects.length) {
            anchors.add(el);
          }
        });
        return Array.from(anchors);
      };
      /**
       * Cleans HTML.
       *
       * @param input The input HTML.
       */
      this.cleanHTML = (input) => {
        const tmp = document.createElement("div");
        tmp.innerHTML = input;
        const allowed = /* @__PURE__ */ new Set(["STRONG", "EM", "S", "A", "BR", "P", "DIV", "SPAN"]);
        const normalize = (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            const tag = el.tagName;
            if (tag === "B") {
              this.replaceTag(el, "STRONG");
            } else if (tag === "I") {
              this.replaceTag(el, "EM");
            } else if (tag === "STRIKE" || tag === "DEL") {
              this.replaceTag(el, "S");
            }
            const current = el.tagName;
            if (!allowed.has(current)) {
              const parent = el.parentNode;
              while (el.firstChild) {
                parent == null ? void 0 : parent.insertBefore(el.firstChild, el);
              }
              parent == null ? void 0 : parent.removeChild(el);
              return;
            }
            if (current === "A") {
              [...el.attributes].forEach((attr) => {
                if (!["href", "rel", "target"].includes(attr.name)) el.removeAttribute(attr.name);
              });
              const href = el.getAttribute("href") || "";
              if (!this.isSafeUrl(href)) {
                this.unwrapNode(el);
              } else {
                this.applyLinkTargetRel(el);
              }
            } else {
              [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
            }
          }
          let child = node.firstChild;
          while (child) {
            const next = child.nextSibling;
            normalize(child);
            child = next;
          }
        };
        normalize(tmp);
        return tmp.innerHTML.replace(/\s+data-empty=\"true\"/g, "").trim();
      };
      /**
       * Replaces a tag.
       *
       * @param el The element.
       * @param newTag The new tag.
       */
      this.replaceTag = (el, newTag) => {
        const repl = document.createElement(newTag);
        while (el.firstChild) {
          repl.appendChild(el.firstChild);
        }
        el.replaceWith(repl);
      };
      /**
       * Unwraps a node.
       *
       * @param el The element.
       */
      this.unwrapNode = (el) => {
        const parent = el.parentNode;
        if (!parent) {
          return;
        }
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      };
      var _a, _b, _c, _d;
      this.root = root;
      this.rootToolbar = rootToolbar;
      this.opt = {
        placeholder: (_a = options.placeholder) != null ? _a : "",
        toolbar: (_b = options.toolbar) != null ? _b : true,
        targetBlank: (_c = options.targetBlank) != null ? _c : true,
        rel: (_d = options.rel) != null ? _d : "noopener noreferrer",
        initialHTML: options.initialHTML,
        onChange: options.onChange
      };
      this.mount();
    }
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
    const {
      mode = "blankLineIsParagraph",
      keepEmpty = false,
      className,
      doc = document,
      allowHtml = true
    } = opts;
    const frag = doc.createDocumentFragment();
    if (text == null) return frag;
    const normalized = String(text).replace(/\r\n?/g, "\n");
    const chunks = mode === "everyLineIsParagraph" ? normalized.split("\n") : normalized.split(/\n{2,}/);
    const appendContent = (parent, content) => {
      if (!allowHtml) {
        parent.appendChild(doc.createTextNode(content));
        return;
      }
      const tpl = doc.createElement("template");
      tpl.innerHTML = content;
      parent.appendChild(tpl.content);
    };
    for (const raw of chunks) {
      const paraText = mode === "everyLineIsParagraph" ? raw : raw.replace(/\n+$/g, "");
      if (!keepEmpty && /^\s*$/.test(paraText)) continue;
      const p = doc.createElement("p");
      if (className) p.className = className;
      if (mode === "everyLineIsParagraph") {
        appendContent(p, paraText);
      } else {
        const lines = paraText.split("\n");
        lines.forEach((line, i) => {
          if (i > 0) p.appendChild(doc.createElement("br"));
          appendContent(p, line);
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
          console.log("loaded messages", messages);
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
          Text: this.editor.getHTML(),
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
            li.querySelector("time"),
            `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`
          );
          setHTML(
            li.querySelector(".home-message-messages-item-text"),
            paragraphsFromText(message.Text)
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
        setValue(this.form.querySelector('input[name="bgColor"]'), message.BgColor);
        setValue(this.form.querySelector('input[name="textColor"]'), message.TextColor);
        setChecked(this.form.querySelector('input[name="dismissible"]'), message.Dismissible);
        this.editor.setHTML(message.Text);
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
        this.editor.setHTML("");
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
      const input = document.getElementById("input-message");
      const toolbar = document.getElementById("input-message-toolbar");
      this.editor = new TinyEditor(input, toolbar);
      this.resetForm();
    }
  };

  // Jellyfin.Plugin.HomeMessage/Web/js/messages.ts
  var c = new MessagesController();
  c.loadMessages();
})();
//# sourceMappingURL=messages.js.map
