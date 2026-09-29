import Link from "next/link";

export const metadata = { title: "Refund & Cancellation Policy | BoxShot Maker" };

export default function RefundsPage() {
  return <main className="bg-slate-50 px-6 py-14"><article className="mx-auto max-w-3xl rounded-3xl border bg-white p-7 shadow-sm sm:p-10"><p className="text-sm font-semibold text-indigo-600">BoxShot Maker</p><h1 className="mt-2 text-4xl font-black tracking-tight">Refund & Cancellation Policy</h1><p className="mt-2 text-sm text-slate-500">Last updated: September 29, 2026</p><div className="prose prose-slate mt-10 max-w-none">
    <h2>1. Cancellation</h2>
    <p>You may cancel your recurring BoxShot Maker subscription through the subscription-management tools provided by Lemon Squeezy or by following the cancellation instructions available through your billing receipt/account.</p>
    <p>Cancellation normally stops future renewals. Unless otherwise required by applicable law or stated at checkout, cancellation does not automatically refund a billing period that has already been charged.</p>
    <h2>2. Refund requests</h2>
    <p>If you believe you were charged in error, were charged after a valid cancellation, or experienced a qualifying billing issue, contact support promptly with the account email and relevant transaction details. Refunds are reviewed on a case-by-case basis and are subject to applicable law and the payment processor's rules.</p>
    <h2>3. Subscription changes</h2>
    <p>If you change between the $8 Starter, $10 Creator, and $15 Studio plans, the billing and proration treatment may be determined by Lemon Squeezy and the subscription configuration active at the time of the change.</p>
    <h2>4. Download allowances</h2>
    <p>Unused downloads are not cash balances and are not redeemable for money. The Starter plan provides 10 downloads per billing period, Creator provides 20, and Studio provides unlimited downloads. Download allowances reset according to the subscription billing cycle and applicable successful payment events.</p>
    <h2>5. Chargebacks</h2>
    <p>If you believe a charge is incorrect, please contact support before initiating a chargeback where possible so the issue can be investigated and corrected.</p>
    <h2>6. Contact</h2>
    <p>For cancellation or refund questions, use the support contact provided by BoxShot Maker.</p>
    <p className="pt-4"><Link href="/" className="font-semibold text-indigo-600 hover:text-indigo-500">Return to BoxShot Maker</Link></p>
  </div></article></main>;
}
