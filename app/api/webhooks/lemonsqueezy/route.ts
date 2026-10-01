import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planFromVariant } from "@/lib/lemonsqueezy";
import { dateOrNull, verifyLemonSignature } from "@/lib/webhook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  if (!verifyLemonSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const event = payload?.meta?.event_name as string;
    const data = payload?.data;
    const attrs = data?.attributes || {};
    const lemonSubscriptionId = String(data?.id || "");
    if (!lemonSubscriptionId) return NextResponse.json({ ok: true });

    const customUserId = payload?.meta?.custom_data?.user_id
      ? String(payload.meta.custom_data.user_id)
      : null;
    const existing = await db.subscription.findUnique({ where: { lemonSubscriptionId } });
    const customerId = attrs.customer_id ? String(attrs.customer_id) : existing?.lemonCustomerId || null;
    const userId = customUserId || existing?.userId;

    if (customerId && userId) {
      await db.user.update({
        where: { id: userId },
        data: { lemonCustomerId: customerId },
      }).catch(() => undefined);
    }

    if (!userId) return NextResponse.json({ ok: true });

    if ([
      "subscription_created",
      "subscription_updated",
      "subscription_payment_success",
      "subscription_cancelled",
      "subscription_expired",
      "subscription_payment_failed",
      "subscription_payment_recovered",
    ].includes(event)) {
      const variantId = String(attrs.variant_id || existing?.variantId || "");
      const plan = planFromVariant(variantId) || existing?.plan || "basic";
      const status = String(attrs.status || existing?.status || "active");
      const renewsAt = dateOrNull(attrs.renews_at);
      const endsAt = dateOrNull(attrs.ends_at);

      const resetDownloads =
        event === "subscription_created" ||
        event === "subscription_payment_success" ||
        (existing && existing.plan !== plan);

      await db.subscription.upsert({
        where: { lemonSubscriptionId },
        create: {
          userId,
          lemonSubscriptionId,
          lemonCustomerId: customerId,
          variantId,
          plan,
          status,
          renewsAt,
          endsAt,
          downloadsUsed: 0,
        },
        update: {
          userId,
          lemonCustomerId: customerId,
          variantId,
          plan,
          status,
          renewsAt,
          endsAt,
          ...(resetDownloads ? { downloadsUsed: 0, currentPeriodStart: new Date() } : {}),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lemon Squeezy webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
