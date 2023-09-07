import tap from "tap";
import { _test } from "./lib.js";

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
