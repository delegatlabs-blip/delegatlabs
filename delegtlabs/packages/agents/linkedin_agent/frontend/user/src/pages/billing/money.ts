export function formatInrFromMinor(priceInrMinor: number): string {
  const rupees = priceInrMinor / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function slotLabel(slot: string): string {
  if (slot === "daily_text") return "Text-only posts today";
  if (slot === "daily_image") return "Image posts today";
  if (slot === "weekly_image") return "Image posts this week";
  return slot;
}
