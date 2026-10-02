import { describe, expect, it } from "vitest";
import { telegramHelpText } from "./telegram-help";

describe("Telegram role help", () => {
  it("identifies Kevin and directs him to expense submission", () => {
    expect(telegramHelpText("Kevin von Whatever", "expense_reporter")).toBe(
      "Hello Kevin von Whatever. Your linked role is expense reporter. Use /expense to submit an expense.",
    );
  });

  it("does not offer sales to an expense reporter", () => {
    expect(telegramHelpText("Kevin von Whatever", "expense_reporter")).not.toContain("/sale");
  });
});
