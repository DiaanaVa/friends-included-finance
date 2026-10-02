import { describe, expect, it } from "vitest";
import { decisionText } from "./integration-messages";

describe("decision notifications", () => {
  it("reports the corrected split and euro commissions for a ten-euro sale", () => {
    const message = decisionText("SALE", {
      reference: "S-REGRESSION",
      amount_cents: 1_000,
      commission_pool_cents: 100,
      proposed_richard_pct: 50,
      proposed_anastasia_pct: 30,
      proposed_jean_claude_pct: 20,
      approved_richard_pct: 20,
      approved_anastasia_pct: 30,
      approved_jean_claude_pct: 50,
      richard_commission_cents: 20,
      anastasia_commission_cents: 30,
      jean_claude_commission_cents: 50,
    });

    expect(message).toContain("commission split changed");
    expect(message).toContain("total commission €1.00");
    expect(message).toContain("Richard: 50% → 20% (€0.20)");
    expect(message).toContain("Anastasia: 30% → 30% (€0.30)");
    expect(message).toContain("Jean-Claude: 20% → 50% (€0.50)");
  });
});
