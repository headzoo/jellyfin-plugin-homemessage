/**
 * TinyEditor — a tiny, dependency-free WYSIWYG editor using contenteditable.
 *
 * Features: Bold, Italic, Strikethrough, Link/Unlink, keyboard shortcuts, paste-as-plain-text,
 * minimal sanitization/normalization on getHTML()/setHTML().
 *
 * Usage:
 *   import TinyEditor from "./TinyEditor";
 *
 *   const root = document.getElementById("editor");
 *   const ed = new TinyEditor(root!, { placeholder: "Type here…" });
 *
 *   // Programmatic access:
 *   ed.setHTML("<p>Hello <strong>world</strong></p>");
 *   const html = ed.getHTML();
 *
 * HTML scaffold (example):
 *   <div id="input-message-toolbar"></div>
 *   <div id="editor"></div>
 */
export default class TinyEditor {
  /**
   * THe root element.
   */
  private root: HTMLElement;

  /**
   * The root toolbar element.
   */
  private rootToolbar: HTMLElement;

  /**
   * The toolbar element appended to the root toolbar.
   */
  private toolbarEl?: HTMLDivElement;

  /**
   * The contenteditable element.
   */
  private editable!: HTMLDivElement;

  /**
   * The allowed tags.
   */
  private allowedTags = new Set(['STRONG', 'EM', 'S', 'A', 'BR', 'P', 'DIV', 'SPAN', 'U']);

  /**
   * The options.
   */
  private opt: Required<Omit<TinyEditorOptions, 'onChange' | 'initialHTML'>> &
    Pick<TinyEditorOptions, 'onChange' | 'initialHTML'>;

  /**
   * Saved selection range.
   */
  private savedRange: Range | null = null;

  /**
   * Constructs a new TinyEditor instance.
   *
   * @param root The root input element.
   * @param rootToolbar The root toolbar element.
   * @param options The options.
   */
  constructor(root: HTMLElement, rootToolbar: HTMLElement, options: TinyEditorOptions = {}) {
    this.root = root;
    this.rootToolbar = rootToolbar;
    this.opt = {
      placeholder: options.placeholder ?? '',
      toolbar: options.toolbar ?? true,
      targetBlank: options.targetBlank ?? true,
      rel: options.rel ?? 'noopener noreferrer',
      initialHTML: options.initialHTML,
      onChange: options.onChange,
    };

    this.mount();
  }

  /**
   * Focuses the editor.
   */
  public focus = (): void => {
    this.editable.focus();
  };

  /**
   * Sets the HTML content of the editor.
   *
   * @param html The HTML content.
   */
  public setHTML = (html: string): void => {
    const clean = this.cleanHTML(html);
    this.editable.innerHTML = clean || '';
    this.togglePlaceholder();
  };

  /**
   * Gets the HTML content of the editor.
   *
   * Returns normalized & sanitized HTML.
   */
  public getHTML = (): string => {
    return this.cleanHTML(this.editable.innerHTML);
  };

  /**
   * Destroys the editor.
   */
  public destroy = (): void => {
    document.removeEventListener('selectionchange', this.onSelectionChange);
    this.editable.removeEventListener('keydown', this.onKeydown);
    this.editable.removeEventListener('input', this.onInput);
    this.editable.removeEventListener('paste', this.onPaste);
    this.root.innerHTML = '';
  };

  /**
   * Mounts the editor.
   */
  private mount = (): void => {
    this.root.classList.add('hm-te');

    if (this.opt.toolbar) {
      this.toolbarEl = this.buildToolbar();
      this.rootToolbar.innerHTML = '';
      this.rootToolbar.appendChild(this.toolbarEl);
    }

    this.editable = document.createElement('div');
    this.editable.className = 'hm-te-editable';
    this.editable.contentEditable = 'true';
    if (this.opt.placeholder) {
      this.editable.setAttribute('data-placeholder', this.opt.placeholder);
    }
    this.root.appendChild(this.editable);

    // Give focus to the editable when clicking inside the root.
    this.root.addEventListener('click', (e) => {
      if (e.target === this.editable || this.editable.contains(e.target as Node)) {
        return;
      }
      if (this.toolbarEl && this.toolbarEl.contains(e.target as Node)) {
        return;
      }

      this.editable.focus();

      // Move cursor to the end.
      const range = document.createRange();
      range.selectNodeContents(this.editable);
      range.collapse(false);

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });

    document.addEventListener('selectionchange', this.onSelectionChange);
    this.editable.addEventListener('keydown', this.onKeydown);
    this.editable.addEventListener('input', this.onInput);
    this.editable.addEventListener('paste', this.onPaste);

    const initial = this.opt.initialHTML ?? '';
    if (initial) {
      this.setHTML(initial);
    } else {
      this.togglePlaceholder();
    }
  };

  /**
   * Builds the toolbar.
   */
  private buildToolbar = (): HTMLDivElement => {
    const tb = document.createElement('div');
    tb.className = 'hm-te-toolbar';

    /**
     * Creates a button.
     *
     * @param label The button label.
     * @param title The title attribute.
     * @param cmd The command to execute.
     * @param extra More command options.
     */
    const mkBtn = (label: string, title: string, cmd: string, extra?: (e: MouseEvent) => void) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hm-te-btn emby-button raised';
      b.textContent = label;
      b.title = title;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus
      b.addEventListener('click', (e) => {
        this.editable.focus();
        if (extra) {
          extra(e);
        } else {
          this.exec(cmd as any);
        }
      });
      b.dataset.cmd = cmd;

      return b;
    };

    const bBold = mkBtn('B', 'Bold (Ctrl/Cmd+B)', 'bold');
    bBold.style.fontWeight = 'bold';

    const bItalic = mkBtn('I', 'Italic (Ctrl/Cmd+I)', 'italic');
    bItalic.style.fontStyle = 'italic';

    const bUnderline = mkBtn('U', 'Underline (Ctrl/Cmd+U)', 'underline');
    bUnderline.style.textDecoration = 'underline';

    const bStrike = mkBtn('S', 'Strikethrough (Ctrl/Cmd+Shift+S)', 'strikeThrough');
    bStrike.style.textDecoration = 'line-through';

    const bLink = mkBtn('🔗', 'Add or edit link (Ctrl/Cmd+K)', 'createlink', () =>
      this.handleLink(),
    );

    const bUnlink = mkBtn('⛓️', 'Remove link', 'unlink', () => this.exec('unlink'));

    tb.append(bBold, bItalic, bUnderline, bStrike, bLink, bUnlink);

    return tb;
  };

  /**
   * Executes a command.
   *
   * @param cmd The command to execute.
   * @param value The value to pass to the command.
   */
  private exec = (
    cmd: 'bold' | 'italic' | 'strikeThrough' | 'createLink' | 'underline' | 'unlink',
    value?: string,
  ) => {
    if (!this.isSelectionInEditor()) {
      return;
    }

    // eslint-disable-next-line deprecation/deprecation
    document.execCommand(cmd, false, value);
    if (cmd === 'createLink') {
      this.ensureLinkAttrs();
    }
    this.updateToolbarState();
    this.emitChange();
  };

  /**
   * Handles a link.
   */
  private handleLink = (): void => {
    if (!this.isSelectionInEditor()) {
      return;
    }

    const a = this.closestAnchor();
    const current = a?.getAttribute('href') || '';

    // Save selection because prompt will blur selection in some browsers
    this.saveSelection();
    const url = window.prompt('Link URL (http(s)://, mailto:, tel:)', current || 'https://');
    this.restoreSelection();

    if (!url) {
      return; // cancelled
    }

    if (a) {
      // Update existing link
      if (this.isSafeUrl(url)) {
        a.setAttribute('href', url);
        this.applyLinkTargetRel(a);
      } else {
        // Unsafe — unwrap the link
        this.unwrapNode(a);
      }
    } else {
      // Create a link around the selection (or insert new text if collapsed)
      const sel = window.getSelection();
      if (!sel) {
        return;
      }

      if (sel.isCollapsed) {
        // Insert the URL text then link it
        // eslint-disable-next-line deprecation/deprecation
        document.execCommand('insertText', false, url);
        // Select the just-inserted text and link it
        const r = sel.getRangeAt(0);
        r.setStart(r.startContainer, Math.max(0, r.startOffset - url.length));
        sel.removeAllRanges();
        sel.addRange(r);
      }

      // eslint-disable-next-line deprecation/deprecation
      document.execCommand('createLink', false, url);
      this.ensureLinkAttrs();
    }

    this.emitChange();
  };

  /**
   * Ensures link attributes.
   */
  private ensureLinkAttrs = (): void => {
    // Ensure rel/target on current selection's anchor(s)
    const anchors = this.getAnchorsInSelectionOrParent();
    anchors.forEach((a) => this.applyLinkTargetRel(a));
  };

  /**
   * Applies link target/rel attributes.
   *
   * @param a The anchor element.
   */
  private applyLinkTargetRel = (a: HTMLAnchorElement): void => {
    const href = a.getAttribute('href') || '';
    if (!this.isSafeUrl(href)) {
      this.unwrapNode(a);
      return;
    }

    if (this.opt.targetBlank) {
      a.setAttribute('target', '_blank');
    }

    const rel = this.opt.rel.trim();
    if (rel) {
      a.setAttribute('rel', rel);
    }
  };

  /**
   * Checks if a URL is safe.
   *
   * @param url The URL to check.
   */
  private isSafeUrl = (url: string): boolean => {
    try {
      const u = new URL(url, window.location.origin);
      const scheme = u.protocol.replace(':', '').toLowerCase();
      return ['http', 'https', 'mailto', 'tel'].includes(scheme);
    } catch {
      // Treat relative URLs as safe if they don't contain javascript:
      return !/^\s*javascript:/i.test(url);
    }
  };

  /**
   * Handles keydown events.
   *
   * @param e The event.
   */
  private onKeydown = (e: KeyboardEvent) => {
    const meta = e.ctrlKey || e.metaKey;
    if (!meta) {
      return;
    }

    const key = e.key.toLowerCase();
    if (key === 'b') {
      e.preventDefault();
      this.exec('bold');
    } else if (key === 'i') {
      e.preventDefault();
      this.exec('italic');
    } else if (key === 'k') {
      e.preventDefault();
      this.handleLink();
    } else if (key === 's' && e.shiftKey) {
      e.preventDefault();
      this.exec('strikeThrough');
    }
  };

  /**
   * Handles input events.
   */
  private onInput = (): void => {
    this.togglePlaceholder();
    this.emitChange();
  };

  /**
   * Handles paste events.
   *
   * @param e The event.
   */
  private onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    // eslint-disable-next-line deprecation/deprecation
    document.execCommand('insertText', false, text);
  };

  /**
   * Handles selection change events.
   */
  private onSelectionChange = (): void => {
    if (!this.isSelectionInEditor() || !this.toolbarEl) {
      return;
    }
    this.updateToolbarState();
  };

  /**
   * Updates the toolbar state.
   */
  private updateToolbarState = (): void => {
    if (!this.toolbarEl) {
      return;
    }

    const states: Record<string, boolean> = {
      // eslint-disable-next-line deprecation/deprecation
      bold: document.queryCommandState('bold'),
      // eslint-disable-next-line deprecation/deprecation
      italic: document.queryCommandState('italic'),
      // eslint-disable-next-line deprecation/deprecation
      strikeThrough: document.queryCommandState('strikeThrough'),
    };

    this.toolbarEl.querySelectorAll<HTMLButtonElement>('.hm-te-btn').forEach((btn) => {
      const cmd = btn.dataset.cmd || '';
      const active = (states as any)[cmd] || (cmd === 'createlink' && !!this.closestAnchor());
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  /**
   * Emits a change event.
   */
  private emitChange = (): void => {
    if (this.opt.onChange) {
      this.opt.onChange(this.getHTML());
    }
  };

  /**
   * Toggles the placeholder.
   */
  private togglePlaceholder = (): void => {
    if (!this.opt.placeholder) {
      return;
    }

    const text = this.editable.textContent?.trim() ?? '';
    if (text.length === 0 && this.editable.innerHTML.replace(/<br\s*\/?>/gi, '').trim() === '') {
      this.editable.setAttribute('data-empty', 'true');
    } else {
      this.editable.removeAttribute('data-empty');
    }
  };

  /**
   * Checks if the selection is in the editor.
   */
  private isSelectionInEditor = (): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return false;
    }

    const { anchorNode, focusNode } = sel;
    return (
      !!(anchorNode && this.editable.contains(anchorNode)) ||
      !!(focusNode && this.editable.contains(focusNode))
    );
  };

  /**
   * Saves the selection.
   */
  private saveSelection = (): void => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
    }
  };

  /**
   * Restores the selection.
   */
  private restoreSelection = (): void => {
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
  private closestAnchor = (): HTMLAnchorElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return null;
    }

    let node: Node | null = sel.anchorNode;
    while (node && node !== this.editable) {
      if (node instanceof HTMLAnchorElement) return node;
      node = node.parentNode;
    }

    return null;
  };

  /**
   * Gets the anchors in the selection or parent.
   */
  private getAnchorsInSelectionOrParent = (): HTMLAnchorElement[] => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return [];
    }

    const r = sel.getRangeAt(0);
    const container =
      r.commonAncestorContainer instanceof Element
        ? r.commonAncestorContainer
        : r.commonAncestorContainer.parentElement;
    if (!container) {
      return [];
    }

    const anchors = new Set<HTMLAnchorElement>();
    // If selection is inside a single anchor
    const a = this.closestAnchor();
    if (a) {
      anchors.add(a);
    }

    // Also gather any anchors fully/partially within the range
    container.querySelectorAll('a').forEach((el) => {
      const rects = (el as HTMLElement).getClientRects();
      if (rects.length) {
        anchors.add(el as HTMLAnchorElement);
      }
    });

    return Array.from(anchors);
  };

  /**
   * Cleans HTML.
   *
   * @param input The input HTML.
   */
  private cleanHTML = (input: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = input;

    /**
     * Normalizes a node.
     *
     * @param node The node.
     */
    const normalize = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName;

        // Map deprecated tags
        if (tag === 'B') {
          this.replaceTag(el, 'STRONG');
        } else if (tag === 'I') {
          this.replaceTag(el, 'EM');
        } else if (tag === 'STRIKE' || tag === 'DEL') {
          this.replaceTag(el, 'S');
        }

        const current = el.tagName;
        if (!this.allowedTags.has(current)) {
          // unwrap node, keep children
          const parent = el.parentNode;
          while (el.firstChild) {
            parent?.insertBefore(el.firstChild, el);
          }

          parent?.removeChild(el);
          return; // children were moved; no need to descend into el
        }

        // Attributes: only allow href/rel/target on <a>
        if (current === 'A') {
          [...el.attributes].forEach((attr) => {
            if (!['href', 'rel', 'target'].includes(attr.name)) el.removeAttribute(attr.name);
          });
          const href = el.getAttribute('href') || '';
          if (!this.isSafeUrl(href)) {
            this.unwrapNode(el);
          } else {
            this.applyLinkTargetRel(el as HTMLAnchorElement);
          }
        } else {
          // Strip all attributes on other tags
          [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
        }
      }

      // Recurse
      let child = node.firstChild;
      while (child) {
        const next = child.nextSibling;
        normalize(child);
        child = next;
      }
    };

    normalize(tmp);

    // Trim leading/trailing whitespace-only nodes
    return tmp.innerHTML.replace(/\s+data-empty=\"true\"/g, '').trim();
  };

  /**
   * Replaces a tag.
   *
   * @param el The element.
   * @param newTag The new tag.
   */
  private replaceTag = (el: HTMLElement, newTag: string): void => {
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
  private unwrapNode = (el: Element): void => {
    const parent = el.parentNode;
    if (!parent) {
      return;
    }

    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  };
}

/**
 * TinyEditor options.
 */
export interface TinyEditorOptions {
  /**
   * The placeholder text.
   */
  placeholder?: string;

  /**
   * Whether to show the toolbar.
   */
  toolbar?: boolean;

  /**
   * The target blank attribute.
   */
  targetBlank?: boolean;

  /**
   * The rel attribute.
   */
  rel?: string;

  /**
   * The initial HTML.
   */
  initialHTML?: string;

  /**
   * The onChange callback.
   */
  onChange?: (html: string) => void;
}
