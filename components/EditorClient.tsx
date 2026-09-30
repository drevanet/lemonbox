"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ImagePlus,
  Save,
  Download,
  Trash2,
  ArrowLeft,
  Crown,
  CheckCircle2,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { FaceImages } from "./BoxScene";
import BillingCards from "./BillingCards";

const BoxScene = dynamic(() => import("./BoxScene"), {
  ssr: false,
});

type Project = {
  id: string;
  name: string;
  frontImage: string | null;
  rightImage: string | null;
  topImage: string | null;
  background: string;
  scale: number;
};

type EditorClientProps = {
  projectId: string | null;
};

type Subscription = {
  plan: string;
  status: string;
  variantId: string;
  downloadsUsed: number;
  renewsAt: string | null;
  endsAt: string | null;
  currentPeriodStart: string;
};

type BillingStatus = {
  subscribed: boolean;
  subscription: Subscription | null;
};

export default function EditorClient({
  projectId: initialProjectId,
}: EditorClientProps) {
  const router = useRouter();

  const canvasWrap = useRef<HTMLDivElement>(null);

  const fileRefs = {
    front: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
    top: useRef<HTMLInputElement>(null),
  };

  const [projectId, setProjectId] = useState<string | null>(
    initialProjectId,
  );

  const [name, setName] = useState("Untitled box");

  const [images, setImages] = useState<FaceImages>({
    front: null,
    right: null,
    top: null,
  });

  const [background, setBackground] = useState("#eef2ff");
  const [scale, setScale] = useState(1);

  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [message, setMessage] = useState("");

  const [billing, setBilling] = useState(false);

  const [billingLoading, setBillingLoading] =
    useState(true);

  const [billingStatus, setBillingStatus] =
    useState<BillingStatus | null>(null);

  /*
   * Load subscription status
   */
  useEffect(() => {
    let cancelled = false;

    async function loadBillingStatus() {
      try {
        const response = await fetch(
          "/api/billing/status",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          if (!cancelled) {
            setBillingStatus({
              subscribed: false,
              subscription: null,
            });
          }

          return;
        }

        const data =
          (await response.json()) as BillingStatus;

        if (!cancelled) {
          setBillingStatus(data);
        }
      } catch (error) {
        console.error(
          "Billing status error:",
          error,
        );

        if (!cancelled) {
          setBillingStatus({
            subscribed: false,
            subscription: null,
          });
        }
      } finally {
        if (!cancelled) {
          setBillingLoading(false);
        }
      }
    }

    loadBillingStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Load project
   */
  useEffect(() => {
    if (!initialProjectId) return;

    let cancelled = false;

    async function loadProject() {
      try {
        const response = await fetch(
          `/api/projects/${initialProjectId}`,
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(
            data.error ||
              "Could not load project.",
          );

          return;
        }

        const project: Project | undefined =
          data.project;

        if (!project || cancelled) return;

        setProjectId(project.id);
        setName(project.name);

        setImages({
          front: project.frontImage,
          right: project.rightImage,
          top: project.topImage,
        });

        setBackground(project.background);
        setScale(project.scale);
      } catch (error) {
        console.error(
          "Load project error:",
          error,
        );

        if (!cancelled) {
          setMessage(
            "Could not load project.",
          );
        }
      }
    }

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [initialProjectId]);

  /*
   * Upload artwork
   */
  async function upload(
    face: keyof FaceImages,
    file?: File,
  ) {
    if (!file) return;

    if (file.size > 3_000_000) {
      setMessage(
        "Keep each artwork image below 3 MB.",
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImages((current) => ({
        ...current,
        [face]: reader.result as string,
      }));

      setMessage("");
    };

    reader.onerror = () => {
      setMessage(
        "Could not read that image.",
      );
    };

    reader.readAsDataURL(file);
  }

  /*
   * Save project
   */
  async function save() {
    setSaving(true);
    setMessage("");

    try {
      const body = {
        name,
        frontImage: images.front,
        rightImage: images.right,
        topImage: images.top,
        background,
        scale,
      };

      const response = await fetch(
        projectId
          ? `/api/projects/${projectId}`
          : "/api/projects",
        {
          method: projectId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Could not save the project.",
        );

        return;
      }

      if (!projectId && data.project?.id) {
        setProjectId(data.project.id);

        router.replace(
          `/editor?id=${data.project.id}`,
        );
      }

      setMessage("Saved");
    } catch (error) {
      console.error(
        "Save project error:",
        error,
      );

      setMessage(
        "Could not save the project.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Delete project
   */
  async function remove() {
    if (!projectId) return;

    const confirmed = window.confirm(
      "Delete this project?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();

        setMessage(
          data.error ||
            "Could not delete the project.",
        );

        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(
        "Delete project error:",
        error,
      );

      setMessage(
        "Could not delete the project.",
      );
    }
  }

  /*
   * Download PNG
   */
  async function download() {
    if (!projectId) {
      setMessage(
        "Save the project before downloading.",
      );

      return;
    }

    setDownloading(true);
    setMessage("");

    try {
      const permission = await fetch(
        "/api/downloads",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
          }),
        },
      );

      const permissionData =
        await permission.json();

      if (!permission.ok) {
        setMessage(
          permissionData.error ||
            "Download unavailable.",
        );

        if (
          permission.status === 402 ||
          permission.status === 429
        ) {
          setBilling(true);
        }

        return;
      }

      const canvas =
        canvasWrap.current?.querySelector(
          "canvas",
        );

      if (!canvas) {
        setMessage(
          "Preview is not ready yet.",
        );

        return;
      }

      const link =
        document.createElement("a");

      link.download =
        `${
          name
            .replace(/[^a-z0-9]+/gi, "-")
            .toLowerCase() ||
          "boxshot"
        }.png`;

      link.href = canvas.toDataURL(
        "image/png",
        1,
      );

      link.click();

      setMessage(
        permissionData.downloadLimit === null
          ? "Downloaded — unlimited plan"
          : "Downloaded",
      );

      /*
       * Refresh subscription usage
       * after successful download.
       */
      try {
        const response = await fetch(
          "/api/billing/status",
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const data =
            (await response.json()) as BillingStatus;

          setBillingStatus(data);
        }
      } catch {
        // Download already succeeded.
      }
    } catch (error) {
      console.error(
        "Download error:",
        error,
      );

      setMessage(
        "Could not download the PNG.",
      );
    } finally {
      setDownloading(false);
    }
  }

  /*
   * Convert database plan name
   * into display name.
   */
  function formatPlan(plan: string) {
    const names: Record<string, string> = {
      starter: "Starter",
      basic: "Creator",
      creator: "Creator",
      pro: "Studio",
      studio: "Studio",
    };

    return (
      names[plan.toLowerCase()] ||
      plan.charAt(0).toUpperCase() +
        plan.slice(1)
    );
  }

  /*
   * Format subscription status
   */
  function formatStatus(status: string) {
    const names: Record<string, string> = {
      active: "Active",
      on_trial: "Trial",
      paused: "Paused",
      cancelled: "Cancelled",
      expired: "Expired",
    };

    return (
      names[status.toLowerCase()] ||
      status
    );
  }

  /*
   * Format dates
   */
  function formatDate(
    date: string | null,
  ) {
    if (!date) return null;

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  }

  /*
   * Download limits
   */
  function getDownloadLimit(
    plan: string,
  ): number | null {
    const normalized =
      plan.toLowerCase();

    if (normalized === "starter") {
      return 10;
    }

    if (
      normalized === "basic" ||
      normalized === "creator"
    ) {
      return 20;
    }

    if (
      normalized === "pro" ||
      normalized === "studio"
    ) {
      return null;
    }

    return null;
  }

  const subscription =
    billingStatus?.subscription;

  const isSubscribed =
    billingStatus?.subscribed === true &&
    !!subscription;

  const downloadLimit =
    subscription
      ? getDownloadLimit(
          subscription.plan,
        )
      : null;

  return (
    <main className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className="w-48 bg-transparent font-bold outline-none sm:w-72"
              />

              <p className="text-xs text-slate-400">
                3D BoxShot Editor
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <Save size={16} />

              {saving
                ? "Saving…"
                : "Save"}
            </button>

            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Download size={16} />

              {downloading
                ? "Preparing…"
                : "Download PNG"}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN EDITOR */}
      <div className="mx-auto grid max-w-[1500px] gap-5 p-5 lg:grid-cols-[280px_1fr_280px]">
        {/* ARTWORK SIDEBAR */}
        <aside className="order-2 rounded-2xl border bg-white p-5 lg:order-1">
          <h2 className="font-bold">
            Artwork
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Upload images for the visible
            faces.
          </p>

          <Face
            name="Front"
            value={images.front}
            onClick={() =>
              fileRefs.front.current?.click()
            }
          />

          <input
            ref={fileRefs.front}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) =>
              upload(
                "front",
                event.target.files?.[0],
              )
            }
          />

          <Face
            name="Right side"
            value={images.right}
            onClick={() =>
              fileRefs.right.current?.click()
            }
          />

          <input
            ref={fileRefs.right}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) =>
              upload(
                "right",
                event.target.files?.[0],
              )
            }
          />

          <Face
            name="Top"
            value={images.top}
            onClick={() =>
              fileRefs.top.current?.click()
            }
          />

          <input
            ref={fileRefs.top}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) =>
              upload(
                "top",
                event.target.files?.[0],
              )
            }
          />

          {/* SCALE */}
          <label className="mt-6 block text-sm font-semibold">
            Box scale

            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.05"
              value={scale}
              onChange={(event) =>
                setScale(
                  Number(
                    event.target.value,
                  ),
                )
              }
              className="mt-3 w-full"
            />
          </label>

          {/* BACKGROUND */}
          <label className="mt-5 block text-sm font-semibold">
            Background

            <input
              type="color"
              value={background}
              onChange={(event) =>
                setBackground(
                  event.target.value,
                )
              }
              className="mt-3 h-10 w-full cursor-pointer rounded-lg"
            />
          </label>

          {/* DELETE */}
          {projectId && (
            <button
              type="button"
              onClick={remove}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-red-500"
            >
              <Trash2 size={16} />
              Delete project
            </button>
          )}
        </aside>

        {/* 3D PREVIEW */}
        <section className="order-1 min-h-[620px] lg:order-2">
          <div
            ref={canvasWrap}
            className="h-[620px] rounded-3xl"
            style={{
              background,
            }}
          >
            <BoxScene
              images={images}
              scale={scale}
            />
          </div>
        </section>

        {/* DOWNLOAD / SUBSCRIPTION */}
        <aside className="order-3 h-fit rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2">
            <Crown
              size={18}
              className="text-indigo-500"
            />

            <h2 className="font-bold">
              Downloads
            </h2>
          </div>

          {/* CHECKING STATUS */}
          {billingLoading ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              <Loader2
                size={16}
                className="animate-spin"
              />

              Checking subscription…
            </div>
          ) : isSubscribed &&
            subscription ? (
            <>
              {/* ACTIVE SUBSCRIPTION */}
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                      Current plan
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                      {formatPlan(
                        subscription.plan,
                      )}
                    </h3>
                  </div>

                  {/* STATUS */}
                  <div className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-green-600">
                    <CheckCircle2
                      size={13}
                    />

                    {formatStatus(
                      subscription.status,
                    )}
                  </div>
                </div>

                {/* DOWNLOAD USAGE */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      Downloads
                    </span>

                    <span className="font-bold text-slate-900">
                      {subscription.downloadsUsed}

                      {downloadLimit === null
                        ? " / Unlimited"
                        : ` / ${downloadLimit}`}
                    </span>
                  </div>

                  {downloadLimit !== null && (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (subscription.downloadsUsed /
                              downloadLimit) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* RENEWAL DATE */}
                {subscription.renewsAt && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays
                      size={14}
                    />

                    <span>
                      Renews{" "}
                      {formatDate(
                        subscription.renewsAt,
                      )}
                    </span>
                  </div>
                )}

                {/* END DATE */}
                {subscription.endsAt && (
                  <div className="mt-2 text-xs text-slate-500">
                    Ends{" "}
                    {formatDate(
                      subscription.endsAt,
                    )}
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Your subscription is active.
                Your download allowance is
                reset according to your billing
                period.
              </p>

              {/* CHANGE PLAN */}
              <button
                type="button"
                onClick={() =>
                  setBilling(
                    (value) => !value,
                  )
                }
                className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                {billing
                  ? "Hide plans"
                  : "Change plan"}
              </button>

              {billing && (
                <div className="mt-5">
                  <BillingCards />
                </div>
              )}
            </>
          ) : (
            <>
              {/* NO ACTIVE SUBSCRIPTION */}
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Save projects for free. A
                subscription is required to
                export PNG downloads.
              </p>

              <button
                type="button"
                onClick={() =>
                  setBilling(
                    (value) => !value,
                  )
                }
                className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                {billing
                  ? "Hide plans"
                  : "View plans"}
              </button>

              {billing && (
                <div className="mt-5">
                  <BillingCards />
                </div>
              )}
            </>
          )}

          {/* MESSAGE */}
          {message && (
            <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm">
              {message}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

/*
 * Artwork face upload component
 */
function Face({
  name,
  value,
  onClick,
}: {
  name: string;
  value: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:border-indigo-400"
    >
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        {value ? (
          <img
            src={value}
            alt={`${name} artwork`}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImagePlus
            size={18}
            className="text-slate-400"
          />
        )}
      </div>

      <span className="text-sm font-semibold">
        {name}

        <small className="block font-normal text-slate-400">
          Click to upload
        </small>
      </span>
    </button>
  );
}