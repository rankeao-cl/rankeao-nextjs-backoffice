type TableColumnLike =
  | string
  | number
  | { key?: string | number | null }
  | null
  | undefined;

export function getTableColumnKey(column: TableColumnLike): string {
  if (typeof column === "string" || typeof column === "number") {
    return String(column);
  }

  if (column && typeof column === "object" && "key" in column) {
    const key = column.key;
    if (typeof key === "string" || typeof key === "number") {
      return String(key);
    }
  }

  return "";
}
