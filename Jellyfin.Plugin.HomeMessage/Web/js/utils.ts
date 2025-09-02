/**
 * Creates a new element.
 *
 * @param tagName The tag name of the element to create.
 * @param attributes The attributes to set on the element.
 */
export const createElement = (
  tagName: string,
  attributes: Record<string, string> = {},
): HTMLElement => {
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
export function setHTML(el: HTMLElement | null, html: string) {
  if (!el) {
    return;
  }

  el.innerHTML = html;
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
