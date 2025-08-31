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
