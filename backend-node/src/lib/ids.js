// Django's BigAutoField means every primary key is a bigint, which Prisma
// surfaces as a JS BigInt. These helpers keep the conversion in one place:
// BigInt going into the database, Number coming back out (ids are far below
// Number.MAX_SAFE_INTEGER).

/** Parse a value into a BigInt id, or return null when it isn't one. */
export function toId(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return null;
  try {
    return BigInt(text);
  } catch {
    return null;
  }
}

/** Convert a BigInt id back to a plain number for JSON output. */
export const fromId = (value) => (value === null || value === undefined ? null : Number(value));
