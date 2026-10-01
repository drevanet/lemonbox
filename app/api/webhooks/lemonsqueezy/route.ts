import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { planFromVariant } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

type LemonWebhook = {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
      lemon_customer_id?: string;
    };
  };

  data?: {
    type?: string;
    id?: string;

    attributes?: {
      store_id?: number;

      customer_id?: number;
      variant_id?: number;

      product_id?: number;
      order_id?: number;

      product_name?: string;
      variant_name?: string;

      user_name?: string;
      user_email?: string;

      status?: string;

      renews_at?: string | null;
      ends_at?: string | null;

      created_at?: string;
      updated_at?: string;

      test_mode?: boolean;
    };
  };
};

function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
) {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const digestBuffer = Buffer.from(digest, "utf8");
  const signatureBuffer = Buffer.from(
    signature,
    "utf8",
  );

  if (
    digestBuffer.length !==
    signatureBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    digestBuffer,
    signatureBuffer,
  );
}

export async function POST(request: Request) {
  try {
    const secret =
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
      console.error(
        "LEMONSQUEEZY_WEBHOOK_SECRET is missing.",
      );

      return NextResponse.json(
        {
          error:
            "Webhook secret is not configured.",
        },
        { status: 500 },
      );
    }

    /*
     * IMPORTANT:
     *
     * Read the raw body BEFORE JSON.parse().
     * Lemon Squeezy signs the raw request body.
     */
    const rawBody = await request.text();

    const signature =
      request.headers.get("X-Signature") || "";

    const eventHeader =
      request.headers.get("X-Event-Name") || "";

    if (!signature) {
      console.error(
        "Lemon Squeezy webhook signature missing.",
      );

      return NextResponse.json(
        {
          error: "Missing webhook signature.",
        },
        { status: 401 },
      );
    }

    const validSignature = verifySignature(
      rawBody,
      signature,
      secret,
    );

    if (!validSignature) {
      console.error(
        "Invalid Lemon Squeezy webhook signature.",
      );

      return NextResponse.json(
        {
          error: "Invalid webhook signature.",
        },
        { status: 401 },
      );
    }

    if (!rawBody) {
      return NextResponse.json(
        {
          error: "Empty webhook body.",
        },
        { status: 400 },
      );
    }

    let payload: LemonWebhook;

    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error(
        "Invalid Lemon Squeezy webhook JSON:",
        error,
      );

      return NextResponse.json(
        {
          error: "Invalid JSON.",
        },
        { status: 400 },
      );
    }

    const eventName =
      payload.meta?.event_name ||
      eventHeader ||
      "";

    const data = payload.data;

    if (!data) {
      console.error(
        "Lemon Squeezy webhook has no data.",
      );

      return NextResponse.json(
        {
          error: "Webhook data missing.",
        },
        { status: 400 },
      );
    }

    const attributes = data.attributes || {};

    console.log(
      "Lemon Squeezy webhook received:",
      {
        eventName,
        subscriptionId: data.id,
        variantId: attributes.variant_id,
        customerId: attributes.customer_id,
      },
    );

    /*
     * We only process subscription events here.
     *
     * Other Lemon Squeezy events can safely return 200.
     */
    const subscriptionEvents = [
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "subscription_resumed",
      "subscription_expired",
      "subscription_paused",
      "subscription_unpaused",
      "subscription_payment_failed",
      "subscription_payment_success",
      "subscription_payment_recovered",
    ];

    if (!subscriptionEvents.includes(eventName)) {
      console.log(
        `Ignoring Lemon Squeezy event: ${eventName}`,
      );

      return NextResponse.json({
        received: true,
        ignored: true,
        event: eventName,
      });
    }

    /*
     * Find the BoxShot user.
     *
     * Our checkout sends:
     *
     * meta.custom_data.user_id
     */
    const customUserId =
      payload.meta?.custom_data?.user_id;

    let user = null;

    if (customUserId) {
      user = await db.user.findUnique({
        where: {
          id: customUserId,
        },
      });
    }

    /*
     * Fallback: try the Lemon Squeezy customer ID.
     */
    if (!user && attributes.customer_id) {
      user = await db.user.findFirst({
        where: {
          lemonCustomerId:
            String(attributes.customer_id),
        },
      });
    }

    /*
     * Fallback: try email.
     */
    if (!user && attributes.user_email) {
      user = await db.user.findUnique({
        where: {
          email: attributes.user_email
            .trim()
            .toLowerCase(),
        },
      });
    }

    if (!user) {
      console.error(
        "Could not find BoxShot user for Lemon Squeezy webhook.",
        {
          customUserId,
          customerId: attributes.customer_id,
          email: attributes.user_email,
          eventName,
        },
      );

      /*
       * Return 200 so Lemon Squeezy doesn't repeatedly
       * retry an event that cannot be associated with
       * a local user.
       */
      return NextResponse.json({
        received: true,
        processed: false,
        reason: "User not found",
      });
    }

    /*
     * Save Lemon Squeezy customer ID.
     */
    if (
      attributes.customer_id &&
      user.lemonCustomerId !==
        String(attributes.customer_id)
    ) {
      await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          lemonCustomerId:
            String(attributes.customer_id),
        },
      });
    }

    /*
     * Determine plan from Lemon Squeezy variant.
     */
    const variantId = attributes.variant_id
      ? String(attributes.variant_id)
      : "";

    const plan = planFromVariant(
      variantId,
    );

    if (!plan) {
      console.error(
        "Unknown Lemon Squeezy variant:",
        variantId,
      );

      return NextResponse.json({
        received: true,
        processed: false,
        reason: "Unknown variant",
        variantId,
      });
    }

    /*
     * Determine subscription status.
     */
    let status =
      attributes.status || "active";

    /*
     * Explicit event overrides.
     */
    if (
      eventName ===
      "subscription_cancelled"
    ) {
      status = "cancelled";
    }

    if (
      eventName ===
      "subscription_expired"
    ) {
      status = "expired";
    }

    if (
      eventName ===
      "subscription_paused"
    ) {
      status = "paused";
    }

    if (
      eventName ===
      "subscription_unpaused"
    ) {
      status = "active";
    }

    /*
     * Dates.
     */
    const renewsAt =
      attributes.renews_at
        ? new Date(attributes.renews_at)
        : null;

    const endsAt =
      attributes.ends_at
        ? new Date(attributes.ends_at)
        : null;

    /*
     * Subscription ID is required by our Prisma schema.
     */
    const lemonSubscriptionId =
      String(data.id || "");

    if (!lemonSubscriptionId) {
      console.error(
        "Lemon Squeezy subscription ID missing.",
      );

      return NextResponse.json(
        {
          error:
            "Subscription ID missing.",
        },
        { status: 400 },
      );
    }

    /*
     * Create or update subscription.
     */
    const existingSubscription =
      await db.subscription.findUnique({
        where: {
          userId: user.id,
        },
      });

    if (existingSubscription) {
      await db.subscription.update({
        where: {
          userId: user.id,
        },
        data: {
          lemonSubscriptionId,
          lemonCustomerId:
            attributes.customer_id
              ? String(attributes.customer_id)
              : existingSubscription.lemonCustomerId,

          variantId,
          plan,
          status,

          renewsAt,
          endsAt,

          /*
           * Do not reset downloadsUsed here.
           *
           * It should be reset by a new billing period/
           * renewal event rather than every webhook update.
           */
        },
      });
    } else {
      await db.subscription.create({
        data: {
          userId: user.id,

          lemonSubscriptionId,

          lemonCustomerId:
            attributes.customer_id
              ? String(attributes.customer_id)
              : user.lemonCustomerId,

          variantId,
          plan,
          status,

          renewsAt,
          endsAt,

          currentPeriodStart:
            new Date(),

          downloadsUsed: 0,
        },
      });
    }

    console.log(
      "Lemon Squeezy subscription processed successfully:",
      {
        eventName,
        userId: user.id,
        plan,
        status,
        variantId,
        lemonSubscriptionId,
      },
    );

    /*
     * VERY IMPORTANT:
     *
     * Lemon Squeezy expects HTTP 200.
     */
    return NextResponse.json({
      received: true,
      processed: true,
      event: eventName,
      plan,
      status,
    });
  } catch (error) {
    console.error(
      "LEMON SQUEEZY WEBHOOK ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed.",
      },
      { status: 500 },
    );
  }
}