import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="text-xl font-black tracking-tight"
        >
          BoxShot<span className="text-indigo-400">.</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="rounded-xl px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-300">
            3D product mockups made simple
          </div>

          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
            Make beautiful
            <span className="block text-indigo-400">
              3D box shots.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Upload your artwork, position it on a realistic 3D box,
            save your project, and download a professional product
            mockup without Photoshop.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-2xl bg-indigo-500 px-7 py-3.5 font-semibold transition hover:bg-indigo-400"
            >
              Start creating free
            </Link>

            <Link
              href="/signin"
              className="rounded-2xl border border-white/15 px-7 py-3.5 font-semibold transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Save your projects before subscribing. Download when you're ready.
          </p>
        </div>

        {/* Editor Preview */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-indigo-950/30">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
              <span className="h-3 w-3 rounded-full bg-red-400/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <span className="h-3 w-3 rounded-full bg-green-400/70" />

              <span className="ml-3 text-xs text-slate-500">
                BoxShot Studio
              </span>
            </div>

            <div className="grid min-h-[380px] md:grid-cols-[220px_1fr]">
              <div className="border-b border-white/10 bg-slate-950/70 p-5 text-left md:border-b-0 md:border-r">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Artwork
                </p>

                <div className="mt-4 space-y-3">
                  <MockControl label="Front artwork" />
                  <MockControl label="Side artwork" />
                  <MockControl label="Top artwork" />
                </div>

                <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Settings
                </p>

                <div className="mt-4 space-y-3">
                  <MockSlider label="Box scale" />
                  <MockSlider label="Rotation" />
                </div>
              </div>

              <div className="flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950/40 p-10">
                <div className="relative h-52 w-52 rotate-[-8deg]">
                  <div className="absolute left-8 top-5 h-40 w-28 -skew-y-2 rounded-lg border border-indigo-300/20 bg-gradient-to-br from-indigo-400 to-indigo-700 shadow-2xl">
                    <div className="flex h-full items-center justify-center p-4 text-center">
                      <span className="text-xl font-black text-white">
                        YOUR
                        <br />
                        BOX
                      </span>
                    </div>
                  </div>

                  <div className="absolute left-[132px] top-7 h-40 w-12 skew-y-[-8deg] rounded-r-lg border border-white/10 bg-indigo-900 shadow-xl" />

                  <div className="absolute left-10 top-[-15px] h-9 w-28 -skew-x-[45deg] rounded-t-lg border border-white/10 bg-indigo-300 shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 max-w-5xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Everything you need
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              From artwork to product shot in minutes.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Feature
              title="3D preview"
              text="See your front, side and top artwork applied to a live Three.js box."
            />

            <Feature
              title="Saved projects"
              text="Save your designs and return to them whenever you need to make changes."
            />

            <Feature
              title="Simple downloads"
              text="Export finished product shots as PNG files when you're ready."
            />

            <Feature
              title="Three plans"
              text="Choose 10, 20 or unlimited downloads depending on your workflow."
            />

            <Feature
              title="Secure accounts"
              text="Your projects belong to your account and are protected by server-side authentication."
            />

            <Feature
              title="Lemon Squeezy"
              text="Subscriptions and recurring payments are handled securely through Lemon Squeezy."
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="mx-auto mt-28 max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Simple pricing
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Choose the plan that fits your workflow.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Save projects for free and subscribe when you need to download
            your finished designs.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PricingCard
              name="Starter"
              price="$8"
              downloads="10 downloads / month"
              description="For occasional product mockups."
            />

            <PricingCard
              name="Creator"
              price="$10"
              downloads="20 downloads / month"
              description="For regular design work."
              featured
            />

            <PricingCard
              name="Studio"
              price="$15"
              downloads="Unlimited downloads"
              description="For high-volume mockup creation."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-24 max-w-4xl rounded-3xl border border-indigo-400/20 bg-indigo-500/10 px-6 py-12">
          <h2 className="text-3xl font-bold">
            Ready to create your first box shot?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Create an account, build your project, and export a professional
            3D product mockup.
          </p>

          <Link
            href="/signup"
            className="mt-7 inline-flex rounded-2xl bg-indigo-500 px-7 py-3.5 font-semibold transition hover:bg-indigo-400"
          >
            Start creating
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            © {new Date().getFullYear()} BoxShot. All rights reserved.
          </div>

          <div className="flex flex-wrap gap-5">
            <Link
              href="/terms"
              className="transition hover:text-white"
            >
              Terms & Conditions
            </Link>

            <Link
              href="/privacy"
              className="transition hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link
              href="/refunds"
              className="transition hover:text-white"
            >
              Refund & Cancellation
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition hover:border-indigo-400/20 hover:bg-white/[0.07]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
        ✦
      </div>

      <h3 className="font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {text}
      </p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  downloads,
  description,
  featured = false,
}: {
  name: string;
  price: string;
  downloads: string;
  description: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl border p-7 text-left ${
        featured
          ? "border-indigo-400/50 bg-indigo-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      {featured && (
        <div className="absolute right-5 top-5 rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold">
          Popular
        </div>
      )}

      <h3 className="text-lg font-bold">{name}</h3>

      <div className="mt-5 flex items-end gap-1">
        <span className="text-4xl font-black">{price}</span>
        <span className="pb-1 text-sm text-slate-500">/month</span>
      </div>

      <p className="mt-4 font-semibold text-indigo-300">
        {downloads}
      </p>

      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
        {description}
      </p>

      <Link
        href="/signup"
        className={`mt-6 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
          featured
            ? "bg-indigo-500 text-white hover:bg-indigo-400"
            : "bg-white/10 text-white hover:bg-white/15"
        }`}
      >
        Get started
      </Link>
    </div>
  );
}

function MockControl({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-400">
      {label}
    </div>
  );
}

function MockSlider({ label }: { label: string }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>50%</span>
      </div>

      <div className="h-1.5 rounded-full bg-white/10">
        <div className="h-1.5 w-1/2 rounded-full bg-indigo-500" />
      </div>
    </div>
  );
}


