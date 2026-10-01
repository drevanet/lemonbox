import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  const user =
    await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;

  const project =
    await db.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

  if (!project) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    project,
  });
}

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
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

    const { id } = await params;

    const existing =
      await db.project.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

    if (!existing) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 },
      );
    }

    const body =
      await request.json();

    const project =
      await db.project.update({
        where: {
          id,
        },

        data: {
          name:
            String(
              body.name ||
                existing.name,
            ),

          frontImage:
            body.frontImage ??
            existing.frontImage,

          rightImage:
            body.rightImage ??
            existing.rightImage,

          topImage:
            body.topImage ??
            existing.topImage,

          background:
            body.background ??
            existing.background,

          scale: Number(
            body.scale ??
              existing.scale,
          ),
        },
      });

    return NextResponse.json({
      project,
    });
  } catch (error) {
    console.error(
      "Update project error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update project.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  const user =
    await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;

  await db.project.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}