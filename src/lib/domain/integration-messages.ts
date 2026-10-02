type Kind = "SALE" | "EXPENSE";

export function decisionText(kind: Kind, row: Record<string, unknown>) {
  const euros = (cents: unknown) => `€${(Number(cents) / 100).toFixed(2)}`;

  if (kind === "SALE") {
    const changed = ["richard", "anastasia", "jean_claude"].some(
      (name) => Number(row[`proposed_${name}_pct`]) !== Number(row[`approved_${name}_pct`]),
    );
    return `${row.reference} approved — commission split ${changed ? "changed" : "confirmed"}. Sale ${euros(row.amount_cents)}; total commission ${euros(row.commission_pool_cents)}. Richard: ${row.proposed_richard_pct}% → ${row.approved_richard_pct}% (${euros(row.richard_commission_cents)}). Anastasia: ${row.proposed_anastasia_pct}% → ${row.approved_anastasia_pct}% (${euros(row.anastasia_commission_cents)}). Jean-Claude: ${row.proposed_jean_claude_pct}% → ${row.approved_jean_claude_pct}% (${euros(row.jean_claude_commission_cents)}).`;
  }

  const changed = String(row.proposed_allocation) !== String(row.final_allocation);
  return `${row.reference} allocated${changed ? " — allocation changed" : ""}. ${euros(row.amount_cents)}: ${row.description}. Proposed: ${row.proposed_allocation}. Approved: ${row.final_allocation}.`;
}
