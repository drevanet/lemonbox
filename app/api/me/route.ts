import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const sub = user.subscription;
  const limit = sub?.plan === "pro" ? null : sub?.plan === "basic" ? 20 : sub?.plan === "starter" ? 10 : 0;
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email }, subscription: sub ? { plan: sub.plan, status: sub.status, downloadsUsed: sub.downloadsUsed, downloadLimit: limit, renewsAt: sub.renewsAt } : null });
}
