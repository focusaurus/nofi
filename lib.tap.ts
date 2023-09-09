import tap from "tap";
import { _test, view, update } from "./lib.js";

function nodesWithKey(...keys) {
  return keys.map((k) => {
    return { key: k };
  });
}

tap.test("sortLower", (t: tap.Test) => {
  let input = [];
  input.sort(_test.sortLower);
  t.same(input, [], "empty");

  input = nodesWithKey("A");
  input.sort(_test.sortLower);
  t.same(input, nodesWithKey("A"), "one element");

  input = nodesWithKey("A", "B", "Z", "z", "b", "a");
  input.sort(_test.sortLower);
  t.same(
    input,
    nodesWithKey("a", "b", "z", "A", "B", "Z"),
    "base case. Lowercase should preceed uppercase (reverse of ASCII numeric order)",
  );

  t.end();
});

tap.test("parseConfig", (t) => {
  try {
    _test.parseConfig("nope}}}");
    t.fail("should throw on invalid config syntax");
  } catch (ex) {
    t.ok(ex);
  }
  let top = _test.parseConfig(`xeyes key="x" "xeyes"`);
  t.match(top, {
    label: "top",
    items: [{ label: "xeyes", key: "x", run: ["xeyes"] }],
  });
  t.end();
});

tap.test("view", (t) => {
  const model = {
    menuStack: [
      {
        label: "top",
        items: [
          { label: "one", key: "o", items: [] },
          {
            label: "two",
            key: "t",
            items: [{ label: "t.a", items: [] }],
          },
        ],
      },
    ],
  };
  tap.same(
    view(model),
    `top

🚀 o: one
📂 t: two
Exit: ctrl+c\t Reload: ctrl+r\tUp: . or escape`,
  );
  t.end();
});

tap.test("update", (t) => {
  const top = {
    label: "top",
    items: [
      { label: "one", key: "o", items: [], run: [] },
      {
        label: "two",
        key: "t",
        items: [{ label: "t.a", items: [] }],
        run: [],
      },
    ],
  };
  const model = { menuStack: [top] };
  const expect = { menuStack: [top, top.items[1]] };
  const [model2, actions] = update(model, "t");
  tap.same(model2, expect);
  tap.equal(actions.length, 0);
  t.end();
});
