export function formatMoney(amount: number, currency: string = "USD") {
  if (currency === "Rupees" || currency === "INR") {
    return `Rs ${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
