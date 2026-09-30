"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
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
  rightImage: string | null;
  topImage: string | null;
  background: string;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scale: number;
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
  renewsAt: string | null;
  endsAt: string | null;
  downloadsUsed: number;
  variantId: string;
};

type SubscriptionResponse = {
  authenticated: boolean;
  subscribed: boolean;
  subscription: Subscription | null;
};

type EditorClientProps = {
  projectId: string | null;
};

type FaceKey = keyof FaceImages;

const faceLabels: Record<FaceKey, string> = {
  front: "Front",
  right: "Right",
  top: "Top",
};

function formatPlanName(plan: string) {
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

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(date: string | null) {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function EditorClient({
  projectId: initialProjectId,
}: EditorClientProps) {
  const router = useRouter();

  const canvasWrap = useRef<HTMLDivElement>(null);

  const frontFileRef =
    useRef<HTMLInputElement>(null);

  const rightFileRef =
    useRef<HTMLInputElement>(null);

  const topFileRef =
    useRef<HTMLInputElement>(null);

  const [projectId, setProjectId] =
    useState<string | null>(initialProjectId);

  const [name, setName] =
    useState("Untitled box");

  const [images, setImages] = useState<FaceImages>({
    front: null,
    right: null,
    top: null,
  });

  const [background, setBackground] =
    useState("#eef2ff");

  const [scale, setScale] =
    useState(1);

  const [saving, setSaving] =
    useState(false);

  const [downloading, setDownloading] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [billing, setBilling] =
    useState(false);

  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [subscribed, setSubscribed] =
    useState(false);

  const [
    subscriptionLoading,
    setSubscriptionLoading,
  ] = useState(true);

  /*
   * Prevent the page from scrolling while
   * the billing modal is open.
   */
  useEffect(() => {
    if (!billing) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [billing]);

  /*
   * Escape closes billing modal.
   */
  useEffect(() => {
    if (!billing) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setBilling(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [billing]);

  /*
   * Load existing project.
   */
  useEffect(() => {
    if (!initialProjectId) return;

    let cancelled = false;

    async function loadProject() {
      try {
        setMessage("");

        const response = await fetch(
          `/api/projects/${initialProjectId}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          if (!cancelled) {
            setMessage(
              data.error ||
                "Could not load project.",
            );
          }

          return;
        }

        const project =
          data.project as Project | undefined;

        if (!project || cancelled) return;

        setProjectId(project.id);

        setName(
          project.name || "Untitled box",
        );

        setImages({
          front: project.frontImage ?? null,
          right: project.rightImage ?? null,
          top: project.topImage ?? null,
        });

        setBackground(
          project.background || "#eef2ff",
        );

        setScale(
          typeof project.scale === "number"
            ? project.scale
            : 1,
        );
      } catch (error) {
        console.error(
          "Failed to load project:",
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
   * Load current subscription.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadSubscription() {
      try {
        setSubscriptionLoading(true);

        const response = await fetch(
          "/api/billing/status",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          if (!cancelled) {
            setSubscribed(false);
            setSubscription(null);
          }

          return;
        }

        const data =
          (await response.json()) as SubscriptionResponse;

        if (cancelled) return;

        setSubscribed(
          Boolean(data.subscribed),
        );

        setSubscription(
          data.subscription ?? null,
        );
      } catch (error) {
        console.error(
          "Failed to load subscription:",
          error,
        );

        if (!cancelled) {
          setSubscribed(false);
          setSubscription(null);
        }
      } finally {
        if (!cancelled) {
          setSubscriptionLoading(false);
        }
      }
    }

    loadSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Upload an image to a face.
   */
  function handleImageUpload(
    face: FaceKey,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please select a valid image file.",
      );

      event.target.value = "";
      return;
    }

    /*
     * Limit image size to 10 MB.
     */
    if (file.size > 10 * 1024 * 1024) {
      setMessage(
        "Image must be smaller than 10 MB.",
      );

      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setMessage(
          "Could not read the selected image.",
        );

        return;
      }

      setImages((current) => ({
        ...current,
        [face]: result,
      }));

      setMessage("");

      /*
       * Allows the same file to be selected again.
       */
      event.target.value = "";
    };

    reader.onerror = () => {
      setMessage(
        "Could not read the selected image.",
      );

      event.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  function removeImage(face: FaceKey) {
    setImages((current) => ({
      ...current,
      [face]: null,
    }));
  }

  /*
   * Save the project.
   */
  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");

      const payload = {
        name:
          name.trim() ||
          "Untitled box",
        frontImage: images.front,
        rightImage: images.right,
        topImage: images.top,
        background,
        scale,
      };

      let response: Response;

      if (projectId) {
        response = await fetch(
          `/api/projects/${projectId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
      } else {
        response = await fetch(
          "/api/projects",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save project.",
        );
      }

      if (data.project?.id) {
        setProjectId(data.project.id);

        /*
         * If this was a brand-new project,
         * update the URL without reloading.
         */
        if (!projectId) {
          router.replace(
            `/editor?id=${data.project.id}`,
          );
        }
      }

      setMessage("Project saved.");
    } catch (error) {
      console.error(
        "Save project error:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save project.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Delete the current project.
   */
  async function handleDelete() {
    if (!projectId) {
      setMessage(
        "This project has not been saved yet.",
      );

      return;
    }

    const confirmed = window.confirm(
      "Delete this project? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setMessage("");

      const response = await fetch(
        `/api/projects/${projectId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete project.",
        );
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(
        "Delete project error:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete project.",
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * Download the rendered canvas.
   */
  async function handleDownload() {
    if (!canvasWrap.current) {
      setMessage(
        "The editor is not ready yet.",
      );

      return;
    }

    try {
      setDownloading(true);
      setMessage("");

      /*
       * Tell the server that a download
       * is being requested. Your server-side
       * quota endpoint should reject users
       * who have reached their limit.
       */
      const quotaResponse = await fetch(
        "/api/downloads",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
        },
      );

      const quotaData =
        await quotaResponse.json();

      if (!quotaResponse.ok) {
        throw new Error(
          quotaData.error ||
            "Download limit reached.",
        );
      }

      const canvas =
        canvasWrap.current.querySelector(
          "canvas",
        );

      if (!canvas) {
        throw new Error(
          "Could not find the editor canvas.",
        );
      }

      /*
       * Create a PNG from the WebGL canvas.
       *
       * preserveDrawingBuffer must be enabled
       * in BoxScene for this to work reliably.
       */
      const dataUrl =
        canvas.toDataURL("image/png");

      const link =
        document.createElement("a");

      const safeName =
        (name || "boxshot")
          .trim()
          .replace(
            /[^a-z0-9-_]+/gi,
            "-",
          )
          .replace(
            /^-+|-+$/g,
            "",
          ) || "boxshot";

      link.download = `${safeName}.png`;
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage(
        "PNG downloaded successfully.",
      );
    } catch (error) {
      console.error(
        "Download error:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to download PNG.",
      );
    } finally {
      setDownloading(false);
    }
  }

  function openFilePicker(face: FaceKey) {
    if (face === "front") {
      frontFileRef.current?.click();
    }

    if (face === "right") {
      rightFileRef.current?.click();
    }

    if (face === "top") {
      topFileRef.current?.click();
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              title="Back to dashboard"
            >
              <ArrowLeft size={19} />
            </Link>

            <div className="min-w-0">
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className="w-full max-w-[260px] truncate border-0 bg-transparent p-0 text-base font-black text-slate-950 outline-none focus:ring-0 md:text-lg"
                placeholder="Untitled box"
              />

              {projectId && (
                <div className="text-xs text-slate-400">
                  Saved project
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SUBSCRIPTION STATUS */}
            {subscriptionLoading ? (
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 sm:flex">
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Loading plan...
              </div>
            ) : subscribed &&
              subscription ? (
              <button
                type="button"
                onClick={() =>
                  setBilling(true)
                }
                className="hidden items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-left transition hover:bg-green-100 sm:flex"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
                  <Crown size={16} />
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-green-700">
                    Current Plan
                  </div>

                  <div className="text-sm font-black text-green-950">
                    {formatPlanName(
                      subscription.plan,
                    )}
                  </div>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setBilling(true)
                }
                className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 sm:flex"
              >
                <Crown size={16} />
                View Plans
              </button>
            )}

            {/* SAVE */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              <span className="hidden sm:inline">
                {saving ? "Saving..." : "Save"}
              </span>
            </button>

            {/* DOWNLOAD */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Download size={17} />
              )}

              <span className="hidden sm:inline">
                {downloading
                  ? "Preparing..."
                  : "Download"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MESSAGE */}
      {message && (
        <div className="mx-auto max-w-[1600px] px-4 pt-4 md:px-6">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
            {message}
          </div>
        </div>
      )}

      {/* EDITOR */}
      <div className="mx-auto grid max-w-[1600px] gap-5 p-4 md:p-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        {/* LEFT PANEL */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-950">
              Box faces
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload artwork for each side of
              your box.
            </p>
          </div>

          <div className="space-y-4">
            {(
              [
                "front",
                "right",
                "top",
              ] as FaceKey[]
            ).map((face) => (
              <div
                key={face}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    {faceLabels[face]}
                  </span>

                  {images[face] && (
                    <button
                      type="button"
                      onClick={() =>
                        removeImage(face)
                      }
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title={`Remove ${face} image`}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {images[face] ? (
                  <button
                    type="button"
                    onClick={() =>
                      openFilePicker(face)
                    }
                    className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <img
                      src={images[face] || ""}
                      alt={`${face} preview`}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                      Change image
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      openFilePicker(face)
                    }
                    className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <ImagePlus size={24} />

                    <span className="mt-2 text-xs font-bold">
                      Upload {face}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <input
            ref={frontFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleImageUpload(
                "front",
                event,
              )
            }
          />

          <input
            ref={rightFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleImageUpload(
                "right",
                event,
              )
            }
          />

          <input
            ref={topFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleImageUpload(
                "top",
                event,
              )
            }
          />
        </aside>

        {/* CENTER CANVAS */}
        <section
          ref={canvasWrap}
          className="relative min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          style={{
            background,
          }}
        >
          <div className="absolute left-4 top-4 z-10 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm backdrop-blur">
            3D Preview
          </div>

          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
            <span className="text-xs font-bold text-slate-500">
              Scale
            </span>

            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              value={scale}
              onChange={(event) =>
                setScale(
                  Number(event.target.value),
                )
              }
              className="w-24"
            />

            <span className="w-10 text-right text-xs font-bold text-slate-700">
              {scale.toFixed(2)}
            </span>
          </div>

          <div className="h-[620px] w-full">
            <BoxScene
              images={images}
              scale={scale}
            />
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="space-y-5">
          {/* BACKGROUND */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">
              Background
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the preview background.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <input
                type="color"
                value={background}
                onChange={(event) =>
                  setBackground(
                    event.target.value,
                  )
                }
                className="h-12 w-12 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
              />

              <input
                type="text"
                value={background}
                onChange={(event) =>
                  setBackground(
                    event.target.value,
                  )
                }
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold uppercase outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* SUBSCRIPTION CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {subscriptionLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Loading subscription...
              </div>
            ) : subscribed &&
              subscription ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
                        <Crown size={18} />
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Current Plan
                        </div>

                        <div className="text-lg font-black text-slate-950">
                          {formatPlanName(
                            subscription.plan,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                    {formatStatus(
                      subscription.status,
                    )}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Downloads used
                    </span>

                    <span className="text-sm font-black text-slate-900">
                      {subscription.downloadsUsed}
                    </span>
                  </div>

                  {subscription.renewsAt && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-sm text-slate-500">
                        Renews
                      </span>

                      <span className="text-sm font-bold text-slate-900">
                        {formatDate(
                          subscription.renewsAt,
                        )}
                      </span>
                    </div>
                  )}

                  {subscription.endsAt && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-sm text-slate-500">
                        Ends
                      </span>

                      <span className="text-sm font-bold text-slate-900">
                        {formatDate(
                          subscription.endsAt,
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setBilling(true)
                  }
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                >
                  View Subscription
                </button>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Crown size={19} />
                </div>

                <h2 className="mt-4 text-lg font-black text-slate-950">
                  Upgrade your account
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Subscribe to unlock downloads
                  and additional BoxShot Maker
                  features.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setBilling(true)
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  <Crown size={17} />
                  View Plans
                </button>
              </>
            )}
          </div>

          {/* ACTIONS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">
              Actions
            </h2>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                Save Project
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={17} />
                )}

                Download PNG
              </button>

              {projectId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={17} />
                  )}

                  Delete Project
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* BILLING MODAL */}
      {billing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setBilling(false);
            }
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <button
              type="button"
              onClick={() =>
                setBilling(false)
              }
              className="absolute right-5 top-5 z-10 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {subscribed &&
            subscription ? (
              <div className="pr-10">
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                    <Crown size={17} />
                    Active Subscription
                  </div>

                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Your subscription
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Your current BoxShot Maker
                    subscription details.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="text-sm font-medium text-slate-500">
                      Current Plan
                    </div>

                    <div className="mt-2 text-2xl font-black text-slate-950">
                      {formatPlanName(
                        subscription.plan,
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="text-sm font-medium text-slate-500">
                      Status
                    </div>

                    <div className="mt-3 inline-flex rounded-full bg-green-100 px-3 py-1.5 text-sm font-bold text-green-700">
                      {formatStatus(
                        subscription.status,
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="text-sm font-medium text-slate-500">
                      Downloads
                    </div>

                    <div className="mt-2 text-2xl font-black text-slate-950">
                      {
                        subscription.downloadsUsed
                      }
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Downloads used this
                      period
                    </div>
                  </div>
                </div>

                {subscription.renewsAt && (
                  <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                    <div className="text-sm font-semibold text-indigo-900">
                      Next renewal
                    </div>

                    <div className="mt-1 text-sm text-indigo-700">
                      {formatDate(
                        subscription.renewsAt,
                      )}
                    </div>
                  </div>
                )}

                {subscription.endsAt && (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <div className="text-sm font-semibold text-amber-900">
                      Subscription ends
                    </div>

                    <div className="mt-1 text-sm text-amber-700">
                      {formatDate(
                        subscription.endsAt,
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() =>
                      setBilling(false)
                    }
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Back to Editor
                  </button>
                </div>
              </div>
            ) : (
              <div className="pr-10">
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-950">
                    Choose your plan
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Choose a subscription to
                    unlock PNG downloads and
                    additional features.
                  </p>
                </div>

                <BillingCards />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}