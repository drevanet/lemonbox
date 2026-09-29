import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await db.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, updatedAt: true, background: true } });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const project = await db.project.create({ data: { userId: user.id, name: String(body.name || "Untitled box"), frontImage: body.frontImage || null, rightImage: body.rightImage || null, topImage: body.topImage || null, background: body.background || "#eef2ff", rotationX: Number(body.rotationX ?? -0.15), rotationY: Number(body.rotationY ?? 0.65), rotationZ: Number(body.rotationZ ?? 0), scale: Number(body.scale ?? 1) } });
  return NextResponse.json({ project });
}
