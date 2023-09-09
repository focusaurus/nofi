import { expect, test } from "bun:test";
import { _test, view, update, Item } from "./lib.js";

function itemsByKey(...keys: string[]): Item[] {
  return keys.map((k: string, _index?: number, _array?: string[]) => {
    return { key: k, label: "", run: [], items: [] };
  });
}

test("sortLower", () => {
  let input = itemsByKey();
  input.sort(_test.sortLower);
  expect(input).toEqual([]);

  input = itemsByKey("A");
  input.sort(_test.sortLower);
  expect(input).toEqual(itemsByKey("A"));

  input = itemsByKey("A", "Z", "B", "z", "b", "a");
  input.sort(_test.sortLower);
  expect(input).toEqual(itemsByKey("a", "b", "z", "A", "B", "Z"));
});

test("parseConfig", () => {
  expect(() => _test.parseConfig("nope}}}")).toThrow();
  expect(_test.parseConfig(`xeyes key="x" "xeyes"`)).toEqual({
    label: "top",
    key: "",
    items: [{ label: "xeyes", key: "x", run: ["xeyes"], items: [] }],
  });
});

test("view", () => {
  const top = {
    label: "top",
    key: "",
    items: [
      { label: "one", key: "o", items: [], run: [] },
      {
        label: "two",
        key: "t",
        run: [],
        items: [{ run: [], key: "a", label: "t.a", items: [] }],
      },
    ],
  };
  const model = {
    top,
    menuPath: "",
    console,
    message: "",
    menuStack: [top],
  };
  expect(view(model)).toEqual(`top

🚀 o: one
📂 t: two
Exit: ctrl+c\t Reload: ctrl+r\tUp: . or escape`);
});

test("update", () => {
  const top = {
    label: "top",
    key: "",
    items: [
      { label: "one", key: "o", run: [] },
      {
        label: "two",
        key: "t",
        items: [{ run: [], key: "a", label: "t.a" }],
      },
    ],
  };
  const model = {
    top,
    menuPath: "",
    console,
    message: "",
    menuStack: [top],
  };
  const want = {
    menuStack: [top, top.items[1]],
    top,
    console,
    message: "",
    menuPath: "",
  };
  expect(update(model, "t")).toEqual([want, []]);
});
