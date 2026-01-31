export function formatMoney(amount: number, currency: string = "USD") {
  const formattedAmount = amount.toFixed(2);
  const up = currency.toUpperCase();

  const symbols: Record<string, string> = {
    "LKR": "Rs ",
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "JPY": "¥",
    "CNY": "¥",
    "CAD": "C$",
    "AUD": "A$",
    "CHF": "Fr ",
    "BRL": "R$",
    "ZAR": "R ",
    "MXN": "MX$",
    "RUB": "₽",
    "KRW": "₩",
    "SGD": "S$",
  };

  const symbol = symbols[up] || (up + " ");
  return `${symbol}${formattedAmount}`;
}

export function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
