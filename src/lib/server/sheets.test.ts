import { describe, expect, it } from "vitest";
import { findUpsertRow } from "./sheets";

describe("reference-based Sheets upserts", () => {
  it("updates the existing row for a repeated reference", () => {
    expect(findUpsertRow([["S01"], ["S02"]], "S02")).toBe(3);
  });

  it("appends exactly one row for a new reference", () => {
    expect(findUpsertRow([["S01"], ["S02"]], "S03")).toBe(4);
  });
});
