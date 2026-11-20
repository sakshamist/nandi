export function detectContradictions(messageText: string): string[] {
  const normalized = messageText.toLowerCase();
  const contradictions: string[] = [];

  if (/(no|without|don't have|do not have)[^.]*(tag|rfid)/.test(normalized)
    && /(have|has|tagged|tag present)[^.]*(tag|rfid)/.test(normalized)) {
    contradictions.push("Livestock ID status is stated both as present and absent.");
  }

  if (/(individual|individual owner)/.test(normalized) && /(cooperative|group)/.test(normalized)) {
    contradictions.push("Customer type is stated as both individual and group.");
  }

  return contradictions;
}
