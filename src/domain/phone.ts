// Normalize a Brazilian WhatsApp number into a display format. Pure; used by attendant rules.
export function normalizeWhatsAppNumber(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 11) {
    return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  return input.trim();
}
