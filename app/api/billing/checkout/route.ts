import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCheckout } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { plan } = await request.json();
  const variantId = plan === "pro" ? process.env.LEMONSQUEEZY_PRO_VARIANT_ID : plan === "basic" ? process.env.LEMONSQUEEZY_BASIC_VARIANT_ID : plan === "starter" ? process.env.LEMONSQUEEZY_STARTER_VARIANT_ID : null;
  if (!variantId) return NextResponse.json({ error: "Billing plan is not configured." }, { status: 500 });
  try { return NextResponse.json({ url: await createCheckout(user.id, user.email, variantId, user.lemonCustomerId) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to create checkout." }, { status: 500 }); }
}
