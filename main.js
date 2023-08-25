#!/usr/bin/env node
const path = require("node:path");
const childProcess = require("node:child_process");
require("keypress")(process.stdin);
// without this, we would only get streams once enter is pressed
process.stdin.setRawMode(true);

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
process.stdin.resume();

process.stdin.setEncoding("utf8");

function printMenu(stack) {
  console.clear();
  stack.forEach((menu) => {
    process.stdout.write(`${menu.label} >`);
  });
  console.log();
  Object.entries(stack[stack.length - 1].menu).forEach(([key, action]) => {
    console.log(`${key}: ${action.label}`);
  });
}

let configPath = process.argv[2];
// if (!configPath.startsWith("/")) {
//   configPath = path.join(process.cwd(), configPath);
// }

const top = { label: "top", menu: require(configPath) };

let menuStack = [top];
printMenu(menuStack);
process.stdin.on("keypress", function (ch, key) {
  if (key && key.ctrl && key.name === "c") {
    process.stdin.pause();
    return;
  }
  if (ch === ".") {
    menuStack.pop();
    if (!menuStack[0]) {
      menuStack = [top];
    }
    printMenu(menuStack);
    return;
  }
  const mode = menuStack[menuStack.length - 1];
  const action = mode.menu[ch];
  if (!action) {
    console.log(`Nothing bound to ${ch}`);
    return;
  }
  if (action.command) {
    console.log(`🚀 ${action.command.join(" ")}`);
    childProcess.spawn(action.command[0], action.command.slice(1));
    // re-initialize
    menuStack = [top];
    printMenu(menuStack);
    return;
  }
  if (action.menu) {
    menuStack.push(action);
    printMenu(menuStack);
  }
});
