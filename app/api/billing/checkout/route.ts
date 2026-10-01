import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  createCheckout,
  syncLemonCustomer,
} from "@/lib/lemonsqueezy";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  request: Request,
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    let body: {
      variantId?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const variantId = String(
      body.variantId || "",
    ).trim();

    if (!variantId) {
      return NextResponse.json(
        {
          error:
            "A Lemon Squeezy variant ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const dbUser =
      await db.user.findUnique({
        where: {
          id: user.id,
        },
      });

    if (!dbUser) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    const lemonCustomerId =
      await syncLemonCustomer({
        email: dbUser.email,
        name: dbUser.name,
        existingCustomerId:
          dbUser.lemonCustomerId,
      });

    if (!dbUser.lemonCustomerId) {
      await db.user.update({
        where: {
          id: dbUser.id,
        },
        data: {
          lemonCustomerId,
        },
      });
    }

    const checkoutUrl =
      await createCheckout(
        dbUser.id,
        dbUser.email,
        variantId,
        lemonCustomerId,
      );

    return NextResponse.json(
      {
        url: checkoutUrl,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "CHECKOUT ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create checkout.",
      },
      {
        status: 500,
      },
    );
  }
}