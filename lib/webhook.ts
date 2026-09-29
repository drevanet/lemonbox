import crypto from "node:crypto";

export function verifyLemonSignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.LEMONSQUEEZY_WEBHOOK_SECRET) return false;
  const digest = crypto
    .createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function dateOrNull(value: unknown) {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
