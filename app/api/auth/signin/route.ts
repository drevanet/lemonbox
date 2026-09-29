import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { syncLemonCustomer } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const normalized = String(email || "").trim().toLowerCase();
    const user = await db.user.findUnique({ where: { email: normalized } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Reconcile the local account with Lemon Squeezy every time the customer
    // signs in. This repairs missing customer IDs and keeps name/email current.
    try {
      const lemonCustomerId = await syncLemonCustomer({
        email: user.email,
        name: user.name,
        existingCustomerId: user.lemonCustomerId,
      });

      if (lemonCustomerId !== user.lemonCustomerId) {
        await db.user.update({
          where: { id: user.id },
          data: { lemonCustomerId },
        });
      }
    } catch (syncError) {
      // Authentication should still work if Lemon Squeezy has a temporary API
      // outage. The next sign-in will retry synchronization.
      console.error("Lemon Squeezy customer sync failed", syncError);
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Signin error", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
