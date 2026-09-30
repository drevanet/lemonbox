import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          subscribed: false,
          subscription: null,
        },
        { status: 401 },
      );
    }

    const subscription = await db.subscription.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json({
        authenticated: true,
        subscribed: false,
        subscription: null,
      });
    }

    const activeStatuses = [
      "active",
      "on_trial",
      "paused",
    ];

    const subscribed = activeStatuses.includes(
      subscription.status,
    );

    return NextResponse.json({
      authenticated: true,
      subscribed,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        renewsAt: subscription.renewsAt,
        endsAt: subscription.endsAt,
        downloadsUsed: subscription.downloadsUsed,
        variantId: subscription.variantId,
      },
    });
  } catch (error) {
    console.error(
      "Subscription status error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load subscription status.",
      },
      { status: 500 },
    );
  }
}