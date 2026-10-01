import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          subscribed: false,
          subscription: null,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const subscription =
      await db.subscription.findUnique({
        where: {
          userId: user.id,
        },
      });

    if (!subscription) {
      return NextResponse.json({
        subscribed: false,
        subscription: null,
      });
    }

    const activeStatuses = [
      "active",
      "on_trial",
    ];

    const isActive =
      activeStatuses.includes(
        subscription.status,
      );

    return NextResponse.json({
      subscribed: isActive,

      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        variantId: subscription.variantId,

        downloadsUsed:
          subscription.downloadsUsed,

        renewsAt:
          subscription.renewsAt,

        endsAt:
          subscription.endsAt,

        currentPeriodStart:
          subscription.currentPeriodStart,
      },
    });
  } catch (error) {
    console.error(
      "BILLING STATUS ERROR:",
      error,
    );

    return NextResponse.json(
      {
        subscribed: false,
        subscription: null,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load subscription status.",
      },
      {
        status: 500,
      },
    );
  }
}