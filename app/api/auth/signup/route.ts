import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { syncLemonCustomer } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Use a valid email and a password of at least 8 characters." },
        { status: 400 },
      );
    }

    const normalized = String(email).trim().toLowerCase();
    const exists = await db.user.findUnique({ where: { email: normalized } });
    if (exists) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const lemonCustomerId = await syncLemonCustomer({
      email: normalized,
      name: name?.trim() || null,
    });

    const user = await db.user.create({
      data: {
        name: name?.trim() || null,
        email: normalized,
        passwordHash,
        lemonCustomerId,
      },
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 },
    );
  }
}
