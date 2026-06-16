const DONUT_COLORS = ["#7c3aed", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#8b5cf6"];

export function donutColor(index: number): string {
  return DONUT_COLORS[index % DONUT_COLORS.length] ?? "#7c3aed";
}

export function formatPaymentChannel(channel: string): string {
  const normalized = channel.trim().toUpperCase();
  if (normalized === "ONLINE") return "Online";
  if (normalized === "CASH") return "Cash";
  if (normalized === "CHEQUE") return "Cheque";
  return channel;
}

export function paymentChannelRecordedBy(channel: string): string {
  const normalized = channel.trim().toUpperCase();
  if (normalized === "ONLINE") return "Gateway · auto";
  if (normalized === "CASH" || normalized === "CHEQUE") return "Staff · fees desk";
  return "—";
}
