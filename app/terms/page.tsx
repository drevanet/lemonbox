import Link from "next/link";

export const metadata = { title: "Terms & Conditions | BoxShot Maker" };

export default function TermsPage() {
  return <LegalPage title="Terms & Conditions" updated="September 29, 2026">
    <p>These Terms & Conditions govern your use of BoxShot Maker and its browser-based 3D box-shot creation service.</p>
    <h2>1. Using the service</h2>
    <p>You may use BoxShot Maker to create, save, edit, and export product mockups for lawful personal or commercial purposes. You are responsible for the content and artwork you upload and for ensuring that you have the necessary rights to use it.</p>
    <h2>2. Accounts</h2>
    <p>You are responsible for keeping your account credentials confidential and for activity that occurs through your account. Do not create an account using another person's identity or information.</p>
    <h2>3. Subscriptions and downloads</h2>
    <p>BoxShot Maker offers recurring monthly subscription plans. The $8 Starter plan includes 10 downloads per billing period, the $10 Creator plan includes 20 downloads per billing period, and the $15 Studio plan includes unlimited downloads, subject to the fair and reasonable use of the service.</p>
    <p>Download allowances are enforced by the service and reset following a successful recurring subscription payment for the applicable billing period. Changing plans may change your available download allowance.</p>
    <h2>4. Payments</h2>
    <p>Payments and subscription billing are processed by Lemon Squeezy. By subscribing, you authorize recurring charges according to the plan you select until you cancel.</p>
    <h2>5. Prohibited use</h2>
    <p>You may not use the service to violate applicable law, infringe intellectual-property rights, distribute malicious content, interfere with the service, or attempt to bypass account, subscription, or download controls.</p>
    <h2>6. Intellectual property</h2>
    <p>You retain rights to artwork you upload. BoxShot Maker retains rights in its software, interface, branding, and underlying technology. You receive a license to use the service, not ownership of its software.</p>
    <h2>7. Availability</h2>
    <p>We may modify, suspend, or discontinue parts of the service when reasonably necessary for maintenance, security, legal compliance, or product development.</p>
    <h2>8. Disclaimer and limitation</h2>
    <p>The service is provided on an as-available basis. To the extent permitted by applicable law, BoxShot Maker is not responsible for indirect, incidental, or consequential losses arising from use of the service.</p>
    <h2>9. Changes</h2>
    <p>We may update these terms from time to time. Continued use of the service after an update means you accept the revised terms.</p>
    <h2>10. Contact</h2>
    <p>For questions about these terms, use the support contact provided by the BoxShot Maker service.</p>
    <p className="pt-4"><Link href="/" className="font-semibold text-indigo-600 hover:text-indigo-500">Return to BoxShot Maker</Link></p>
  </LegalPage>;
}

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return <main className="bg-slate-50 px-6 py-14"><article className="mx-auto max-w-3xl rounded-3xl border bg-white p-7 shadow-sm sm:p-10"><p className="text-sm font-semibold text-indigo-600">BoxShot Maker</p><h1 className="mt-2 text-4xl font-black tracking-tight">{title}</h1><p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p><div className="prose prose-slate mt-10 max-w-none">{children}</div></article></main>;
}
