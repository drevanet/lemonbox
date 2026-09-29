import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} BoxShot Maker. All rights reserved.</p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/terms" className="hover:text-slate-950">Terms & Conditions</Link>
          <Link href="/privacy" className="hover:text-slate-950">Privacy Policy</Link>
          <Link href="/refunds" className="hover:text-slate-950">Refund & Cancellation</Link>
        </nav>
      </div>
    </footer>
  );
}
