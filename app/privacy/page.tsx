import Link from "next/link";

export const metadata = { title: "Privacy Policy | BoxShot Maker" };

export default function PrivacyPage() {
  return <main className="bg-slate-50 px-6 py-14"><article className="mx-auto max-w-3xl rounded-3xl border bg-white p-7 shadow-sm sm:p-10"><p className="text-sm font-semibold text-indigo-600">BoxShot Maker</p><h1 className="mt-2 text-4xl font-black tracking-tight">Privacy Policy</h1><p className="mt-2 text-sm text-slate-500">Last updated: September 29, 2026</p><div className="prose prose-slate mt-10 max-w-none">
    <p>This Privacy Policy explains what information BoxShot Maker collects, how it is used, and the choices available to you when you use the service.</p>
    <h2>1. Information we collect</h2>
    <p>When you create an account, we collect information such as your name, email address, and a securely hashed password. We also store projects and project settings you choose to save, including uploaded artwork needed to reproduce your box-shot designs.</p>
    <h2>2. Billing information</h2>
    <p>Subscription payments are handled by Lemon Squeezy. BoxShot Maker receives subscription and billing metadata needed to provide your plan, such as the subscription identifier, plan/variant, status, and billing dates. We do not store your full payment-card number.</p>
    <h2>3. How we use information</h2>
    <p>We use account information to authenticate you, provide saved projects, enforce download allowances, process subscriptions, communicate about your account, protect the service, and improve the product.</p>
    <h2>4. Cookies and sessions</h2>
    <p>We use a secure HTTP-only session cookie to keep you signed in. The cookie is used for authentication and is not intended to contain your password.</p>
    <h2>5. Service providers</h2>
    <p>We may use service providers for hosting, databases, payment processing, email, analytics, security, and other infrastructure necessary to operate the service. Providers receive only information reasonably needed for their function.</p>
    <h2>6. Retention and deletion</h2>
    <p>We retain account and project information while your account is active or as needed to provide the service and meet legal obligations. You may request account or data deletion through the service's support contact, subject to legitimate retention requirements.</p>
    <h2>7. Security</h2>
    <p>We use reasonable technical and organizational measures to protect account information. No internet service can guarantee absolute security.</p>
    <h2>8. Your choices</h2>
    <p>You can stop using the service, cancel a subscription, and request access or deletion of eligible personal information. You can also contact the service regarding privacy questions.</p>
    <h2>9. Children's privacy</h2>
    <p>The service is not directed to children who are not legally permitted to enter into the applicable agreement. Do not use the service if you are not permitted to do so under applicable law.</p>
    <h2>10. Changes</h2>
    <p>We may update this policy as the service changes. The updated date above will indicate when the policy was last revised.</p>
    <p className="pt-4"><Link href="/" className="font-semibold text-indigo-600 hover:text-indigo-500">Return to BoxShot Maker</Link></p>
  </div></article></main>;
}
