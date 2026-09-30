import { describe, expect, it } from "vitest";
import { expenseSubmissionSchema, saleSubmissionSchema } from "./validation";

describe("submission validation", () => {
  it("converts euros to cents", () => {
    const result = expenseSubmissionSchema.parse({ reference: "E01", description: "Taxi", category: "Travel", amount: "80.25", proposedAllocation: "A" });
    expect(result.amount).toBe(8025);
  });

  it("rejects non-positive amounts", () => {
    expect(expenseSubmissionSchema.safeParse({ reference: "E01", description: "Taxi", category: "Travel", amount: "0", proposedAllocation: "A" }).success).toBe(false);
  });

  it("rejects commission shares that do not total 100", () => {
    const result = saleSubmissionSchema.safeParse({ reference: "S01", customer: "Olivia", project: "A", description: "Relatives", amount: "1000", proposedRichardPct: 60, proposedAnastasiaPct: 30, proposedJeanClaudePct: 20 });
    expect(result.success).toBe(false);
  });
});
