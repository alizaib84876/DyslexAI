export type DiffOp = {
  op: string;
  from: string;
  to: string;
};

export function buildDiffOps(before: string, after: string): DiffOp[] {
  const source = before ?? "";
  const target = after ?? "";
  if (source === target) {
    return [];
  }

  const ops: DiffOp[] = [];
  let start = 0;
  while (
    start < source.length &&
    start < target.length &&
    source[start] === target[start]
  ) {
    start += 1;
  }

  let endBefore = source.length - 1;
  let endAfter = target.length - 1;
  while (
    endBefore >= start &&
    endAfter >= start &&
    source[endBefore] === target[endAfter]
  ) {
    endBefore -= 1;
    endAfter -= 1;
  }

  const removed = source.slice(start, endBefore + 1);
  const added = target.slice(start, endAfter + 1);
  if (removed && added) {
    ops.push({ op: "replace", from: removed, to: added });
  } else if (removed) {
    ops.push({ op: "delete", from: removed, to: "" });
  } else if (added) {
    ops.push({ op: "insert", from: "", to: added });
  }
  return ops;
}
