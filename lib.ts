import * as fs from "fs";
import * as readline from "readline";
import * as util from "util";
import * as kdljs from "kdljs";

export interface Menu {
  label: string;
  key: string;
  items: Array<Item | Menu>;
}

export interface Item {
  label: string;
  run: string[];
  key: string;
}

export interface Model {
  top: Menu;
  console: Console;
  menuPath: string;
  menuStack: Menu[];
  message: string;
}

export interface ActionRun {
  type: "run";
  args: string[];
}

export interface ActionMessage {
  type: "message";
  message: string;
}

export interface ActionExit {
  type: "exit";
}

export type Action = ActionExit | ActionRun | ActionMessage;

export interface Keypress {
  name: string;
  ctrl: boolean;
}

export const _test = {
  sortLower,
  parseConfig,
};

export function sortLower(a: Item | Menu, b: Item | Menu): number {
  const codes = [a.key.charCodeAt(0), b.key.charCodeAt(0)];
  codes.forEach((value, i) => {
    if (value >= 65 && value <= 90) {
      // It's an uppercase letter, push it back to after lowercase
      codes[i] = value + 122;
    }
  });
  return (codes[0] || 0) - (codes[1] || 0);
}

type Node = Parameters<typeof kdljs.format>[0][number];

function nodeToItem(node: Node, _index?: number, _array?: Node[]): Item | Menu {
  const base = {
    label: node.name,
    key: node.properties && String(node.properties.key),
  };
  if (node.children.length) {
    return { ...base, items: node.children.map(nodeToItem) };
  } else {
    return { ...base, run: node.values.map((v) => String(v)) };
  }
}

export function parseConfig(menuKDL: string): Menu {
  const result = kdljs.parse(menuKDL);
  if (result.errors.length) {
    throw new Error(result.errors.join("\n"));
  }
  if (!result.output) {
    throw new Error("menu KDL invalid. No output found. (@nofi:400)");
  }
  return {
    label: "top",
    items: result.output.map(nodeToItem),
    key: "",
  };
}

export function loadConfig(menuPath: string) {
  let menuKDL: string = "";
  try {
    menuKDL = fs.readFileSync(menuPath, "utf8");
  } catch (err: any) {
    // ENOENT
    if (err && err.errno === -2) {
      throw new Error(`nofi config file not found at path "${menuPath}"`);
    }
  }
  return parseConfig(menuKDL);
}

export function setupTTY(tty = process.stdin) {
  readline.emitKeypressEvents(tty);

  // without this, we would only get streams once enter is pressed
  tty.setRawMode(true);

  // resume stdin in the parent process (node app won't quit all by itself
  // unless an error or process.exit() happens)
  // tty.resume();

  tty.setEncoding("utf8");
}

export function view(model: Model): string {
  const stack = model.menuStack;
  const lines: string[] = [];
  // this is the breadcrumb that indicates full path from the root for
  // orientation
  lines.push(stack.map((menu) => `${menu.label}`).join(" > "));
  lines.push("");
  let currentMenu = stack[stack.length - 1];
  if (!currentMenu) {
    throw new Error("menu stack unexpectedly empty");
  }
  const items = [...currentMenu.items];
  items.sort(sortLower);
  items.forEach((item) => {
    const icon = isItem(item) ? "🚀" : "📂";
    lines.push(`${icon} ${item.key}: ${item.label}`);
  });
  lines.push("Exit: ctrl+c\t Reload: ctrl+r\tUp: . or escape");
  if (model.message) {
    lines.push(model.message);
  }
  return lines.join("\n");
}
const tagOut: Action = { type: "run", args: ["nofi-out"] };

function isItem(choice: Menu | Item): choice is Item {
  return Array.isArray((choice as Item).run);
}

export function update(
  model: Model,
  ch: string,
  key?: Keypress,
): [Model, Action[]] {
  if (key && key.ctrl && key.name === "c") {
    return [model, [{ type: "exit" }]];
  }

  const actions: Action[] = [];
  if (key && key.ctrl && key.name === "r") {
    // TODO graceful error handling.
    const top = loadConfig(model.menuPath);
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
  if (!mode) {
    throw new Error("menu stack is unexpectedly empty in update()");
  }
  const choice = mode.items.filter((item) => item.key === ch)[0];
  if (!choice) {
    return [
      { ...model, message: `Nothing bound to ${ch} (${key && key.name})` },
      actions,
    ];
  }
  if (isItem(choice)) {
    actions.push({ type: "message", message: `🚀 ${choice.run.join(" ")}` });
    actions.push({ type: "run", args: choice.run });
    // Tell window manager to hide the nofi window
    actions.push(tagOut);
    return [{ ...model, menuStack: [model.top] }, actions];
  } else {
    model.menuStack.push(choice);
  }
  return [model, actions];
}
