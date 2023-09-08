import tap from "tap";
import { _test, view } from "./lib.js";

function nodesWithKey(...keys) {
  return keys.map((k) => {
    return { properties: { key: k } };
  });
}

tap.test("sortLower", (t) => {
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
    name: "top",
    children: [{ name: "xeyes", properties: { key: "x" }, values: ["xeyes"] }],
  });
  t.end();
});

tap.test("view", (t) => {
  const model = {
    menuStack: [
      {
        name: "top",
        children: [
          { name: "one", properties: { key: "o" }, children: [] },
          {
            name: "two",
            properties: { key: "t" },
            children: [{ name: "t.a", children: [] }],
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
