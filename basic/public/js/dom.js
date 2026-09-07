/**
 * Element helper. `el("button", { class: "primary", onclick }, "Save")`.
 *
 * Text is set through textContent, never innerHTML — a task title is data, and
 * data never becomes markup.
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;

    if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2), value);
    } else if (key === "class") {
      node.className = value;
    } else if (key === "value") {
      node.value = value;
    } else if (key === "checked" || key === "disabled" || key === "hidden") {
      node[key] = Boolean(value);
    } else {
      node.setAttribute(key, value === true ? "" : String(value));
    }
  }

  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return node;
}

export function render(root, ...children) {
  root.replaceChildren(...children.flat().filter(Boolean));
}
