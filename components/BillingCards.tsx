"use client";
import { useState } from "react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$8",
    text: "10 downloads per month",
    features: ["3D box editor", "Saved projects", "10 finished downloads/month"],
    button: "Choose Starter",
  },
  {
    id: "basic",
    name: "Creator",
    price: "$10",
    text: "20 downloads per month",
    features: ["Everything in Starter", "20 finished downloads/month", "More export capacity"],
    button: "Choose Creator",
  },
  {
    id: "pro",
    name: "Studio",
    price: "$15",
    text: "Unlimited downloads",
    features: ["Everything in Creator", "Unlimited downloads", "For frequent production"],
    button: "Choose Studio",
    featured: true,
  },
] as const;

export default function BillingCards() {
  const [loading, setLoading] = useState<string | null>(null);

  async function buy(plan: string) {
    setLoading(plan);
    const r = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const d = await r.json();
    if (!r.ok) {
      alert(d.error || "Unable to open checkout");
      setLoading(null);
      return;
    }
    window.location.href = d.url;
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans.map((plan) => (
        <Plan key={plan.id} {...plan} loading={loading === plan.id} onClick={() => buy(plan.id)} />
      ))}
    </div>
  );
}

function Plan({
  name,
  price,
  text,
  features,
  button,
  featured,
  loading,
  onClick,
}: {
  name: string;
  price: string;
  text: string;
  features: readonly string[];
  button: string;
  featured?: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className={`rounded-3xl border p-6 ${featured ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white"}`}>
      {featured && <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold text-white">Unlimited</span>}
      <p className="mt-2 font-bold">{name}</p>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-4xl font-black">{price}</span>
        <span className="pb-1 text-slate-500">/month</span>
      </div>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
      <ul className="my-6 space-y-2 text-sm">
        {features.map((f) => <li key={f}>✓ {f}</li>)}
      </ul>
      <button onClick={onClick} disabled={loading} className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-50">
        {loading ? "Opening checkout…" : button}
      </button>
    </div>
  );
}
