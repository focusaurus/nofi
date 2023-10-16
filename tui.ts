#!/usr/bin/env node
import * as childProcess from "child_process";
import * as os from "os";
import * as path from "path";

import {
  setupTTY,
  loadConfig,
  update,
  view,
  Action,
  ActionRun,
  Model,
  Keypress,
} from "./lib.js";

let menuPath = process.argv[2];
if (!menuPath) {
  menuPath = path.join(os.homedir(), ".config", "nofi", "menu.kdl");
}

let top;
try {
  top = loadConfig(menuPath);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(10);
}
let model: Model = { menuStack: [top], console, top, menuPath, messages: [] };

function runAction(model: Model, action: ActionRun): void {
  const command = action.args[0];
  if (!command) {
    return;
  }
  let sub;
  try {
    sub = childProcess.spawn(command, action.args.slice(1), { detached: true });
  } catch (error) {
    if (error instanceof Error) {
      model.messages.push(`error running ${command}: ${error.message}`);
      review();
    }
    return;
  }
  sub.stderr.on("data", (data) => {
    model.messages.push(`${command} stderr: ${data}`);
    review();
  });
  sub.on("close", (exitCode: number) => {
    if (exitCode !== 0) {
      model.messages.push(`Subprocess ${command} exited code ${exitCode}`);
      review();
    }
  });
  sub.on("error", (error: Error) => {
    model.messages.push(`Subprocess ${command} error: ${error}`);
    review();
  });
}

function review(): void {
  const ui = view(model);
  console.clear();
  console.log(ui);
}

function onKeypress(ch: string, key: Keypress): void {
  let actions: Action[];
  [model, actions] = update(model, ch, key);
  actions.forEach((action) => {
    switch (action.type) {
      case "run":
        runAction(model, action);
        // childProcess.spawn(action.args[0] || "true", action.args.slice(1));
        break;
      // case "message":
      //   console.log(action.message);
      //   break;
      case "exit":
        process.stdin.pause();
        process.exit();
    }
  });
  review();
}
setupTTY(process.stdin);
process.stdin.on("keypress", onKeypress);
console.log(view(model));
