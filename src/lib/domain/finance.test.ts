import { describe, expect, it } from "vitest";
import { calculateCommission } from "./finance";

describe("calculateCommission", () => {
  it("calculates the assignment example", () => {
    expect(calculateCommission(100_000, { richard: 50, anastasia: 30, jean_claude: 20 })).toEqual({
      poolCents: 10_000,
      richardCents: 5_000,
      anastasiaCents: 3_000,
      jeanClaudeCents: 2_000,
    });
  });

  it("calculates a corrected 20/30/50 split for a ten-euro sale", () => {
    expect(calculateCommission(1_000, { richard: 20, anastasia: 30, jean_claude: 50 })).toEqual({
      poolCents: 100,
      richardCents: 20,
      anastasiaCents: 30,
      jeanClaudeCents: 50,
    });
  });

  it("gives a rounding difference to the largest share", () => {
    const result = calculateCommission(101, { richard: 34, anastasia: 33, jean_claude: 33 });
    expect(result.richardCents + result.anastasiaCents + result.jeanClaudeCents).toBe(result.poolCents);
  });

  it("uses Richard then Anastasia then Jean-Claude to break tied largest shares", () => {
    const result = calculateCommission(105, { richard: 50, anastasia: 50, jean_claude: 0 });
    expect(result).toEqual({ poolCents: 11, richardCents: 5, anastasiaCents: 6, jeanClaudeCents: 0 });
  });

  it("rejects a split that does not total 100", () => {
    expect(() => calculateCommission(100_000, { richard: 60, anastasia: 30, jean_claude: 20 })).toThrow();
  });
});
