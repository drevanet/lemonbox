import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email and password are required.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Password must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    // Check if the account already exists.
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    // Hash the password.
    const passwordHash = await bcrypt.hash(
      password,
      12,
    );

    // Create the user.
    // Lemon Squeezy is intentionally NOT called here.
    const user = await db.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
      },
    });

    // Create the application session.
    await createSession(user.id);

    return NextResponse.json(
      {
        ok: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create account. Please try again.",
      },
      { status: 500 },
    );
  }
}