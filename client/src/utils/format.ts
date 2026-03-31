export function formatINR(paise: number | string | bigint): string {
  const num = Number(paise) / 100;
  const isNegative = num < 0;
  const abs = Math.abs(num);

  const intPart = Math.floor(abs).toString();

  let formatted: string;
  if (intPart.length <= 3) {
    formatted = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    formatted = `${groups},${last3}`;
  }

  return `${isNegative ? "-" : ""}₹${formatted}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate().toString().padStart(2, "0");
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function daysUntil(dayOfMonth: number): { days: number; label: string } {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);

  const target = thisMonth >= todayMidnight ? thisMonth : nextMonth;
  const diffMs = target.getTime() - todayMidnight.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return { days: 0, label: "Due today" };
  if (days === 1) return { days: 1, label: "Due tomorrow" };
  if (days < 0) return { days, label: `Overdue by ${Math.abs(days)} days` };
  return { days, label: `${days} days left` };
}

export function balanceStaleness(updatedAt: string): { stale: boolean; label: string } {
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return { stale: false, label: `Updated ${diffDays}d ago` };
  if (diffDays <= 30) return { stale: false, label: `Updated ${diffDays}d ago` };
  return { stale: true, label: `${diffDays} days old` };
}
