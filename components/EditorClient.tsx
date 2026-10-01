"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Crown,
  Download,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  X,
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
  backImage: string | null;

  rightImage: string | null;
  leftImage: string | null;

  topImage: string | null;
  bottomImage: string | null;

  background: string;
  scale: number;
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

type EditorClientProps = {
  projectId?: string | null;
};

const PLAN_LIMITS: Record<string, number | null> = {
  starter: 10,
  basic: 20,
  creator: 20,
  pro: null,
  studio: null,
};

function getPlanName(plan: string) {
  switch (plan.toLowerCase()) {
    case "starter":
      return "Starter";

    case "basic":
      return "Creator";

    case "creator":
      return "Creator";

    case "pro":
      return "Studio";

    case "studio":
      return "Studio";

    default:
      return plan;
  }
}

function getPlanLimit(plan: string) {
  return PLAN_LIMITS[plan.toLowerCase()] ?? null;
}

function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "Active";

    case "on_trial":
      return "Trial";

    case "paused":
      return "Paused";

    case "cancelled":
      return "Cancelled";

    case "expired":
      return "Expired";

    default:
      return status;
  }
}

function formatDate(date: string | null) {
  if (!date) return null;

  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function EditorClient({
  projectId,
}: EditorClientProps) {
  const router = useRouter();

  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);

  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);
  const rightInputRef = useRef<HTMLInputElement | null>(null);
  const leftInputRef = useRef<HTMLInputElement | null>(null);
  const topInputRef = useRef<HTMLInputElement | null>(null);
  const bottomInputRef = useRef<HTMLInputElement | null>(null);

  const [projectIdState, setProjectIdState] = useState<string | null>(
    projectId ?? null,
  );

  const [name, setName] = useState("Untitled box");

  const [images, setImages] = useState<FaceImages>({
    front: null,
    back: null,
    right: null,
    left: null,
    top: null,
    bottom: null,
  });

  const [background, setBackground] = useState("#eef2ff");
  const [scale, setScale] = useState(1);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [billing, setBilling] = useState(false);
  const [billingLoading, setBillingLoading] = useState(true);

  const [billingStatus, setBillingStatus] =
    useState<BillingStatus | null>(null);

  /*
   * LOAD PROJECT
   */
  useEffect(() => {
    if (!projectId) {
      setProjectIdState(null);
      setName("Untitled box");

      setImages({
        front: null,
        back: null,
        right: null,
        left: null,
        top: null,
        bottom: null,
      });

      setBackground("#eef2ff");
      setScale(1);

      return;
    }

    async function loadProject() {
      try {
        setError("");

        const response = await fetch(
          `/api/projects/${projectId}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load project.",
          );
        }

        const project: Project = data.project;

        setProjectIdState(project.id);
        setName(project.name || "Untitled box");

        setImages({
          front: project.frontImage ?? null,
          back: project.backImage ?? null,
          right: project.rightImage ?? null,
          left: project.leftImage ?? null,
          top: project.topImage ?? null,
          bottom: project.bottomImage ?? null,
        });

        setBackground(project.background || "#eef2ff");
        setScale(project.scale || 1);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load project.",
        );
      }
    }

    loadProject();
  }, [projectId]);

  /*
   * LOAD SUBSCRIPTION STATUS
   */
  async function loadBillingStatus() {
    try {
      setBillingLoading(true);

      const response = await fetch("/api/billing/status", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load billing status.",
        );
      }

      setBillingStatus(data);
    } catch (err) {
      console.error("Billing status error:", err);

      setBillingStatus({
        subscribed: false,
        subscription: null,
      });
    } finally {
      setBillingLoading(false);
    }
  }

  useEffect(() => {
    loadBillingStatus();
  }, []);

  /*
   * SAVE PROJECT
   */
  async function saveProject() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        name,
        frontImage: images.front,
        backImage: images.back,
        rightImage: images.right,
        leftImage: images.left,
        topImage: images.top,
        bottomImage: images.bottom,
        background,
        scale,
      };

      const url = projectIdState
        ? `/api/projects/${projectIdState}`
        : "/api/projects";

      const method = projectIdState ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save project.",
        );
      }

      if (data.project?.id) {
        setProjectIdState(data.project.id);

        if (!projectIdState) {
          router.replace(`/editor?id=${data.project.id}`);
        }
      }

      setMessage("Design saved successfully.");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save project.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * DELETE PROJECT
   */
  async function deleteProject() {
    if (!projectIdState) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this project?",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `/api/projects/${projectIdState}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to delete project.",
        );
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete project.",
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * IMAGE UPLOAD
   */
  function handleUpload(
    face: keyof FaceImages,
    file: File | undefined,
  ) {
    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please upload a PNG, JPG or WebP image.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Each image must be smaller than 3 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setError("Unable to read the image.");
        return;
      }

      setImages((current) => ({
        ...current,
        [face]: result,
      }));
    };

    reader.onerror = () => {
      setError("Unable to read the image.");
    };

    reader.readAsDataURL(file);
  }

  function removeImage(face: keyof FaceImages) {
    setImages((current) => ({
      ...current,
      [face]: null,
    }));
  }

  /*
   * DOWNLOAD
   */
  async function downloadImage() {
    try {
      setDownloading(true);
      setError("");

      const response = await fetch("/api/downloads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.status === 402 || response.status === 429) {
        setBilling(true);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to start download.",
        );
      }

      /*
       * Give Three.js a moment to finish rendering.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 250),
      );

      const canvas =
        canvasWrapperRef.current?.querySelector("canvas");

      if (!canvas) {
        throw new Error("3D canvas was not found.");
      }

      const image = canvas.toDataURL(
        "image/png",
        1,
      );

      const link = document.createElement("a");

      link.href = image;
      link.download = `${name || "boxshot"}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      await loadBillingStatus();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to download image.",
      );
    } finally {
      setDownloading(false);
    }
  }

  /*
   * UPLOAD CONTROL
   */
  function FaceUpload({
    label,
    face,
    inputRef,
  }: {
    label: string;
    face: keyof FaceImages;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) {
    const image = images[face];

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800">
            {label}
          </span>

          {image && (
            <button
              type="button"
              onClick={() => removeImage(face)}
              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title={`Remove ${label}`}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 transition hover:border-indigo-400 hover:bg-indigo-50"
        >
          {image ? (
            <img
              src={image}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <ImagePlus size={22} />
              <span className="text-xs font-medium">
                Upload image
              </span>
            </div>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            handleUpload(
              face,
              event.target.files?.[0],
            );

            event.target.value = "";
          }}
        />
      </div>
    );
  }

  const subscription = billingStatus?.subscription;

  const planName = subscription
    ? getPlanName(subscription.plan)
    : null;

  const planLimit = subscription
    ? getPlanLimit(subscription.plan)
    : null;

  const downloadsUsed =
    subscription?.downloadsUsed ?? 0;

  const usageText =
    planLimit === null
      ? `${downloadsUsed} downloads`
      : `${downloadsUsed} / ${planLimit} downloads`;

  const usagePercent =
    planLimit === null
      ? 0
      : Math.min(
          100,
          (downloadsUsed / planLimit) * 100,
        );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>
              <div className="text-lg font-black tracking-tight">
                BoxShot<span className="text-indigo-600">.</span>
              </div>

              <div className="text-xs text-slate-400">
                3D BoxShot Editor
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {message && (
              <div className="hidden rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 sm:block">
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={saveProject}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {saving ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={downloadImage}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Download size={17} />
              )}

              {downloading
                ? "Preparing..."
                : "Download PNG"}
            </button>
          </div>
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* MAIN */}
      <main className="grid min-h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
        {/* LEFT SIDEBAR */}
        <aside className="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r">
          <div className="mb-5">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Project name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Untitled box"
            />
          </div>

          <div className="mb-3">
            <h2 className="text-sm font-black text-slate-900">
              Box faces
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Upload artwork for each side of your box.
            </p>
          </div>

          <div className="space-y-3">
            <FaceUpload
              label="Front"
              face="front"
              inputRef={frontInputRef}
            />

            <FaceUpload
              label="Back"
              face="back"
              inputRef={backInputRef}
            />

            <FaceUpload
              label="Right"
              face="right"
              inputRef={rightInputRef}
            />

            <FaceUpload
              label="Left"
              face="left"
              inputRef={leftInputRef}
            />

            <FaceUpload
              label="Top"
              face="top"
              inputRef={topInputRef}
            />

            <FaceUpload
              label="Bottom"
              face="bottom"
              inputRef={bottomInputRef}
            />
          </div>
        </aside>

        {/* CENTER 3D PREVIEW */}
        <section className="relative min-h-[600px] bg-slate-200">
          <div
            ref={canvasWrapperRef}
            className="absolute inset-0"
          >
            <BoxScene
              images={images}
              scale={scale}
            />
          </div>

          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-500 shadow-lg backdrop-blur">
            Drag to rotate • Scroll to zoom
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Settings
            </h2>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Background
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={background}
                  onChange={(event) =>
                    setBackground(event.target.value)
                  }
                  className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                />

                <input
                  value={background}
                  onChange={(event) =>
                    setBackground(event.target.value)
                  }
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium uppercase outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Box scale
                </label>

                <span className="text-xs font-bold text-slate-600">
                  {scale.toFixed(2)}x
                </span>
              </div>

              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={scale}
                onChange={(event) =>
                  setScale(Number(event.target.value))
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          {/* SUBSCRIPTION */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900">
                Subscription
              </h2>

              <Crown
                size={17}
                className="text-indigo-600"
              />
            </div>

            {billingLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Loading subscription...
                </div>
              </div>
            ) : billingStatus?.subscribed &&
              subscription ? (
              /*
               * SUBSCRIBED STATE
               */
              <button
                type="button"
                onClick={() => setBilling(true)}
                className="w-full text-left"
              >
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 transition hover:border-indigo-400 hover:bg-indigo-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                        Current plan
                      </div>

                      <div className="mt-1 text-xl font-black text-slate-950">
                        {planName}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                      <Check size={12} />
                      {getStatusLabel(
                        subscription.status,
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Downloads</span>
                      <span>{usageText}</span>
                    </div>

                    {planLimit !== null && (
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{
                            width: `${usagePercent}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {subscription.renewsAt && (
                    <div className="mt-4 border-t border-indigo-200 pt-3 text-xs text-slate-500">
                      Renews{" "}
                      <span className="font-bold text-slate-700">
                        {formatDate(
                          subscription.renewsAt,
                        )}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 text-xs font-bold text-indigo-600">
                    Change plan →
                  </div>
                </div>
              </button>
            ) : (
              /*
               * NOT SUBSCRIBED STATE
               */
              <button
                type="button"
                onClick={() => setBilling(true)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current plan
                </div>

                <div className="mt-1 text-xl font-black text-slate-950">
                  Free
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Choose a subscription to unlock
                  downloads and additional usage.
                </p>

                <div className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-center text-xs font-bold text-white">
                  View Plans
                </div>
              </button>
            )}
          </div>

          {/* DELETE */}
          {projectIdState && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={deleteProject}
                disabled={deleting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete project"}
              </button>
            </div>
          )}
        </aside>
      </main>

      {/* BILLING MODAL */}
      {billing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setBilling(false);
            }
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() => setBilling(false)}
              className="absolute right-5 top-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close plans"
            >
              <X size={20} />
            </button>

            <div className="pr-14">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                BoxShot Studio
              </div>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {billingStatus?.subscribed
                  ? "Change your subscription"
                  : "Choose your plan"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {billingStatus?.subscribed
                  ? `You are currently subscribed to the ${planName} plan. Choose another plan below if you want to change your subscription.`
                  : "Choose a plan to unlock PNG downloads and more BoxShot Studio usage."}
              </p>
            </div>

            <div className="mt-7">
              <BillingCards />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}