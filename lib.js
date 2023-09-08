#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs";
import kdl from "kdljs";
import keypress from "keypress";

export const _test = {
  sortLower,
  parseConfig,
};

export function sortLower(a, b) {
  const codes = [a.properties.key.charCodeAt(), b.properties.key.charCodeAt()];
  for (const [i, value] of codes.entries()) {
    if (value < 97) {
      codes[i] += 122;
    }
  }
  return codes[0] - codes[1];
}

export function parseConfig(menuKDL) {
  const result = kdl.parse(menuKDL);
  if (result.errors.length) {
    throw new Error(result.errors.join("\n"));
  }
  return { name: "top", children: result.output };
}

export function loadConfig(menuPath) {
  try {
    const menuKDL = fs.readFileSync(menuPath, "utf8");
    return parseConfig(menuKDL);
  } catch (err) {
    console.error(err);
  }
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
  lines.push(stack.map((menu) => `${menu.name}`).join(" > "));
  lines.push("");
  const items = [...stack[stack.length - 1].children];
  items.sort(sortLower);
  items.forEach((item) => {
    const icon = item.children.length ? "📂" : "🚀";
    lines.push(`${icon} ${item.properties.key}: ${item.name}`);
  });
  lines.push("Exit: ctrl+c\t Reload: ctrl+r");
  if (model.message) {
    lines.push(model.message);
  }
  return lines.join("\n");
}

function tagOut() {
  childProcess.spawn("nofi-out");
}

export function update(model, ch, key) {
  if (key && key.ctrl && key.name === "c") {
    process.stdin.pause();
    process.exit();
    return;
  }
  if (key && key.ctrl && key.name === "r") {
    const top = loadConfig(menuPath);
    return { ...model, menuStack: [top] };
  }
  if (ch === "." || (key && key.name === "escape")) {
    model.menuStack.pop();
    if (!model.menuStack[0]) {
      // TODO handle via signal?
      tagOut();
      return { ...model, menuStack: [model.top] };
    }
    return model;
  }
  const mode = model.menuStack[model.menuStack.length - 1];
  const action = mode.children.filter((item) => item.properties.key === ch)[0];
  if (!action) {
    return { ...model, message: `Nothing bound to ${ch} (${key.name})` };
  }
  if (action.values.length) {
    console.log(`🚀 ${action.values.join(" ")}`);
    childProcess.spawn(action.values[0], action.values.slice(1));
    // TODO handle via signal?
    tagOut();
    return { ...model, menuStack: [model.top] };
  }
  if (action.children.length) {
    model.menuStack.push(action);
  }
  return model;
}
