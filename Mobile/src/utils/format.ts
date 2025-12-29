export function formatMoney(amount: number, currency: string = "USD") {
  const formattedAmount = amount.toFixed(2);

  switch (currency.toUpperCase()) {
    case "LKR":
    case "INR":
      return `Rs ${formattedAmount}`;
    case "EUR":
      return `€${formattedAmount}`;
    case "GBP":
      return `£${formattedAmount}`;
    case "JPY":
      return `¥${formattedAmount}`;
    default:
      return `$${formattedAmount}`;
  }
}

export function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
