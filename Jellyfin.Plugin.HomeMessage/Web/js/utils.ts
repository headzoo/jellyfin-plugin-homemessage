/**
 * Creates a new element.
 *
 * @param tagName The tag name of the element to create.
 * @param attributes The attributes to set on the element.
 */
export const createElement = (
  tagName: string,
  attributes: Record<string, string | HTMLElement[] | DocumentFragment> = {},
): HTMLElement => {
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
    if (typeof value === 'string') {
      el.setAttribute(key, value);
    }
  }

  return el;
};

type Primitive = string | File;
type FormValue = Primitive | Primitive[];
type FormObject = Record<string, FormValue>;

/**
 * Serializes a form into a FormData object.
 *
 * @param form The form to serialize.
 */
export function formValuesAll(form: HTMLFormElement): FormObject {
  const fd = new FormData(form);
  const obj: FormObject = {};
  // De-duplicate keys, then decide single vs array
  for (const name of new Set(fd.keys() as Iterable<string>)) {
    const all = fd.getAll(name); // (string | File)[]
    obj[name] = all.length > 1 ? all : all[0]!;
  }

  return obj;
}

/**
 * Sets the inner HTML of an element.
 *
 * @param el The element.
 * @param html The HTML to set.
 */
export function setHTML(el: HTMLElement | null, html: string | HTMLElement[] | DocumentFragment) {
  if (!el) {
    return;
  }

  if (typeof html === 'string') {
    el.innerHTML = html;
    return;
  }

  if (Array.isArray(html)) {
    el.innerHTML = '';
    for (let i = 0; i < html.length; i++) {
      el.appendChild(html[i]);
    }
    return;
  }

  el.innerHTML = '';
  el.appendChild(html);
}

/**
 * Sets the value of an input element.
 *
 * @param el The form element.
 * @param value The value to set.
 */
export function setValue(el: HTMLInputElement | HTMLSelectElement | null, value: string) {
  if (!el) {
    return;
  }

  el.value = value;
}

/**
 * Sets the checked state of an input element.
 *
 * @param el The form element.
 * @param checked The value to set.
 */
export function setChecked(el: HTMLInputElement | null, checked: boolean) {
  if (!el) {
    return;
  }

  el.checked = checked;
}

/**
 * Sets the value of an attribute on an element.
 *
 * @param el The element.
 * @param name The attribute name.
 * @param value The value to set.
 */
export function setAttribute(el: HTMLElement | null, name: string, value: string) {
  if (!el) {
    return;
  }

  el.setAttribute(name, value);
}

/**
 * Build <p> nodes from text with line breaks.
 * - Blank lines separate paragraphs (default).
 * - Single newlines inside a paragraph become <br>.
 *
 * @param text The text to parse.
 * @param opts The options.
 *   - mode: blankLineIsParagraph | everyLineIsParagraph (default: blankLineIsParagraph)
 *   - keepEmpty: keep empty paragraphs if present (default: false)
 *   - className: optional class for each <p> (default: undefined)
 *   - doc: custom Document (e.g., for iframes) (default: document)
 *   - allowHtml: preserve HTML instead of inserting as text (default: true)
 */
export function paragraphsFromText(
  text: string,
  opts: {
    mode?: 'blankLineIsParagraph' | 'everyLineIsParagraph';
    keepEmpty?: boolean;
    className?: string;
    doc?: Document;
    allowHtml?: boolean;
  } = {},
): DocumentFragment {
  const {
    mode = 'blankLineIsParagraph',
    keepEmpty = false,
    className,
    doc = document,
    allowHtml = true,
  } = opts;

  const frag = doc.createDocumentFragment();
  if (text == null) return frag;

  // Normalize line endings.
  const normalized = String(text).replace(/\r\n?/g, '\n');

  // Determine paragraph chunks.
  const chunks =
    mode === 'everyLineIsParagraph' ? normalized.split('\n') : normalized.split(/\n{2,}/); // one or more blank lines = new paragraph

  // Helper: append HTML (or text) to a node.
  const appendContent = (parent: Element, content: string) => {
    if (!allowHtml) {
      parent.appendChild(doc.createTextNode(content));
      return;
    }
    // Parse as HTML safely via <template> (scripts won't execute during parse).
    const tpl = doc.createElement('template');
    tpl.innerHTML = content;
    parent.appendChild(tpl.content);
  };

  for (const raw of chunks) {
    const paraText = mode === 'everyLineIsParagraph' ? raw : raw.replace(/\n+$/g, ''); // trim trailing \n inside a paragraph only
    if (!keepEmpty && /^\s*$/.test(paraText)) continue;

    const p = doc.createElement('p');
    if (className) p.className = className;

    if (mode === 'everyLineIsParagraph') {
      // Whole line is a paragraph.
      appendContent(p, paraText);
    } else {
      // Inside a paragraph, single newlines become <br>.
      const lines = paraText.split('\n');
      lines.forEach((line, i) => {
        if (i > 0) p.appendChild(doc.createElement('br'));
        appendContent(p, line);
      });
    }

    frag.appendChild(p);
  }

  return frag;
}
