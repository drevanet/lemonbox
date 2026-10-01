"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$8",
    description: "For occasional box shot exports.",
    downloads: "10 downloads / month",
    variantId:
      process.env.NEXT_PUBLIC_LEMONSQUEEZY_STARTER_VARIANT_ID || "",
    features: [
      "3D BoxShot editor",
      "Save projects",
      "10 PNG downloads/month",
      "All six box faces",
    ],
  },
  {
    name: "Creator",
    price: "$10",
    description: "For regular product creators.",
    downloads: "20 downloads / month",
    popular: true,
    variantId:
      process.env.NEXT_PUBLIC_LEMONSQUEEZY_BASIC_VARIANT_ID || "",
    features: [
      "Everything in Starter",
      "20 PNG downloads/month",
      "Save unlimited projects",
      "Priority access",
    ],
  },
  {
    name: "Studio",
    price: "$15",
    description: "For heavy box shot production.",
    downloads: "Unlimited downloads",
    variantId:
      process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID || "",
    features: [
      "Everything in Creator",
      "Unlimited PNG downloads",
      "Unlimited projects",
      "Best for production use",
    ],
  },
];

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text,
    };
  }
}

export default function BillingCards() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function subscribe(variantId: string) {
    if (!variantId) {
      setError("This plan is not configured yet.");
      return;
    }

    setLoading(variantId);
    setError("");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantId,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Unable to start checkout. Server returned ${response.status}.`,
        );
      }

      if (!data?.url) {
        throw new Error(
          "The checkout request succeeded, but Lemon Squeezy did not return a checkout URL.",
        );
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to start checkout.",
      );

      setLoading(null);
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border bg-white p-6 ${
              plan.popular
                ? "border-indigo-500 ring-2 ring-indigo-100"
                : "border-slate-200"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                <Sparkles size={12} />
                Popular
              </div>
            )}

            <h3 className="text-xl font-black">
              {plan.name}
            </h3>

            <p className="mt-2 min-h-[48px] text-sm text-slate-500">
              {plan.description}
            </p>

            <div className="mt-5">
              <span className="text-4xl font-black">
                {plan.price}
              </span>

              <span className="text-sm text-slate-500">
                /month
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold">
              {plan.downloads}
            </div>

            <div className="mt-5 space-y-3">
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-2 text-sm"
                >
                  <Check
                    size={17}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                subscribe(plan.variantId)
              }
              disabled={loading !== null}
              className={`mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                plan.popular
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-slate-950 text-white hover:bg-slate-800"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading === plan.variantId ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Opening checkout…
                </>
              ) : (
                "Subscribe"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}