import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
) {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body =
      await request.json();

    const project =
      await db.project.create({
        data: {
          userId: user.id,

          name:
            String(
              body.name ||
                "Untitled box",
            ),

          frontImage:
            body.frontImage ?? null,

          backImage:
            body.backImage ?? null,

          rightImage:
            body.rightImage ?? null,

          leftImage:
            body.leftImage ?? null,

          topImage:
            body.topImage ?? null,

          bottomImage:
            body.bottomImage ?? null,

          background:
            String(
              body.background ||
                "#eef2ff",
            ),

          scale: Number(
            body.scale ?? 1,
          ),
        },
      });

    return NextResponse.json(
      {
        project,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create project error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create project.",
      },
      { status: 500 },
    );
  }
}