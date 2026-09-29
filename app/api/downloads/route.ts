import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { projectId } = await request.json();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const sub = user.subscription;
  if (!sub || !["active", "on_trial"].includes(sub.status)) return NextResponse.json({ error: "Choose a plan before downloading." }, { status: 402 });
  const limit = sub.plan === "pro" ? null : sub.plan === "basic" ? 20 : sub.plan === "starter" ? 10 : 0;
  if (limit !== null && sub.downloadsUsed >= limit) return NextResponse.json({ error: `You have reached your ${limit}-download monthly limit. Upgrade your plan to continue.` }, { status: 429 });

  const updated = await db.subscription.updateMany({
    where: { id: sub.id, ...(limit !== null ? { downloadsUsed: { lt: limit } } : {}) },
    data: { downloadsUsed: { increment: 1 } },
  });
  if (updated.count !== 1) return NextResponse.json({ error: "Download limit reached. Please try again." }, { status: 429 });
  return NextResponse.json({ ok: true, downloadsUsed: sub.downloadsUsed + 1, downloadLimit: limit });
}
