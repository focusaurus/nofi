#!/usr/bin/env node
import fs from "node:fs";
import kdl from "kdljs";
import keypress from "keypress";

export const _test = {
  sortLower,
  parseConfig,
};

export function sortLower(a, b) {
  const codes = [a.key.charCodeAt(), b.key.charCodeAt()];
  for (const [i, value] of codes.entries()) {
    if (value < 97) {
      codes[i] += 122;
    }
  }
  return codes[0] - codes[1];
}

function nodeToItem(node) {
  return {
    label: node.name,
    run: node.values,
    key: node.properties.key,
    items: node.children.map(nodeToItem),
  };
}

export function parseConfig(menuKDL) {
  const result = kdl.parse(menuKDL);
  if (result.errors.length) {
    throw new Error(result.errors.join("\n"));
  }
  return { label: "top", items: result.output.map(nodeToItem) };
}

export function loadConfig(menuPath) {
  const menuKDL = fs.readFileSync(menuPath, "utf8");
  return parseConfig(menuKDL);
}

export function setupTTY(tty = process.stdin) {
  keypress(tty);
  // without this, we would only get streams once enter is pressed
  tty.setRawMode(true);

  // resume stdin in the parent process (node app won't quit all by itself
  // unless an error or process.exit() happens)
  tty.resume();

  tty.setEncoding("utf8");
  // tty.on("keypress", onKeypress);
}

export function view(model) {
  const stack = model.menuStack;
  const lines = [];
  // this is the breadcrumb that indicates full path from the root for
  // orientation
  lines.push(stack.map((menu) => `${menu.label}`).join(" > "));
  lines.push("");
  const items = [...stack[stack.length - 1].items];
  items.sort(sortLower);
  items.forEach((item) => {
    const icon = item.items.length ? "📂" : "🚀";
    lines.push(`${icon} ${item.key}: ${item.label}`);
  });
  lines.push("Exit: ctrl+c\t Reload: ctrl+r\tUp: . or escape");
  if (model.message) {
    lines.push(model.message);
  }
  return lines.join("\n");
}
const tagOut = { type: "spawn", args: ["nofi-out"] };

export function update(model, ch, key) {
  if (key && key.ctrl && key.name === "c") {
    return [model, [{ type: "exit" }]];
  }

  const actions = [];
  if (key && key.ctrl && key.name === "r") {
    // TODO graceful error handling.
    const top = loadConfig(menuPath);
    return [{ ...model, menuStack: [top] }, actions];
  }
  if (ch === "." || (key && key.name === "escape")) {
    model.menuStack.pop();
    if (!model.menuStack[0]) {
      return [{ ...model, menuStack: [model.top] }, [tagOut]];
    }
    return [model, actions];
  }
  const mode = model.menuStack[model.menuStack.length - 1];
  const action = mode.items.filter((item) => item.key === ch)[0];
  if (!action) {
    return [
      { ...model, message: `Nothing bound to ${ch} (${key.name})` },
      actions,
    ];
  }
  if (action.run.length) {
    actions.push({ type: "message", message: `🚀 ${action.run.join(" ")}` });
    actions.push({ type: "spawn", args: action.run });
    // Tell window manager to hide the nofi window
    actions.push(tagOut);
    return [{ ...model, menuStack: [model.top] }, actions];
  }
  if (action.items.length) {
    model.menuStack.push(action);
  }
  return [model, actions];
}
