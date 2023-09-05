#!/usr/bin/env node
const path = require("node:path");
const childProcess = require("node:child_process");
const fs = require("node:fs");

function loadConfig(menuPath) {
  try {
    const menuJSON = fs.readFileSync(menuPath, "utf8");
    return { label: "top", menu: JSON.parse(menuJSON) };
  } catch (err) {
    console.error(err);
  }
}

function setupTTY() {
  require("keypress")(process.stdin);
  // without this, we would only get streams once enter is pressed
  process.stdin.setRawMode(true);

  // resume stdin in the parent process (node app won't quit all by itself
  // unless an error or process.exit() happens)
  process.stdin.resume();

  process.stdin.setEncoding("utf8");
  process.stdin.on("keypress", onKeypress);
}

function printMenu(stack) {
  console.clear();
  stack.forEach((menu) => {
    process.stdout.write(`${menu.label} >`);
  });
  console.log();
  Object.entries(stack[stack.length - 1].menu).forEach(([key, action]) => {
    console.log(`${key}: ${action.label}`);
  });
  console.log("Exit: ctrl+c\t Reload: ctrl+r");
}

function tagOut() {
  childProcess.spawn("nofi-out");
}

let menuPath = process.argv[2];
let top = loadConfig(menuPath);
let menuStack = [top];
setupTTY();
printMenu(menuStack);

function onKeypress(ch, key) {
  if (key && key.ctrl && key.name === "c") {
    process.stdin.pause();
    process.exit();
    return;
  }
  if (key && key.ctrl && key.name === "r") {
    top = loadConfig(menuPath);
    menuStack = [top];
    return;
  }
  if (ch === "." || key.name === "escape") {
    menuStack.pop();
    if (!menuStack[0]) {
      menuStack = [top];
      tagOut();
    }
    printMenu(menuStack);
    return;
  }
  const mode = menuStack[menuStack.length - 1];
  const action = mode.menu[ch];
  if (!action) {
    console.log(`Nothing bound to ${ch} (${key.name})`);
    return;
  }
  if (action.command) {
    console.log(`🚀 ${action.command.join(" ")}`);
    childProcess.spawn(action.command[0], action.command.slice(1));
    tagOut();
    // re-initialize
    menuStack = [top];
    printMenu(menuStack);
    return;
  }
  if (action.menu) {
    menuStack.push(action);
    printMenu(menuStack);
  }
}
