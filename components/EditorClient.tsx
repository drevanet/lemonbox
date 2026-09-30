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
  scale: number;
};

type EditorClientProps = {
  projectId: string | null;
};

export default function EditorClient({
  projectId: initialProjectId,
}: EditorClientProps) {
  const router = useRouter();

  const canvasWrap = useRef<HTMLDivElement>(null);

  const frontFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);
  const topFileRef = useRef<HTMLInputElement>(null);

  const [projectId, setProjectId] =
    useState<string | null>(initialProjectId);

  const [name, setName] = useState("Untitled box");

  const [images, setImages] = useState<FaceImages>({
    front: null,
    right: null,
    top: null,
  });

  const [background, setBackground] =
    useState("#eef2ff");

  const [scale, setScale] = useState(1);

  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [billing, setBilling] = useState(false);

  /*
   * Load existing project.
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
        setName(project.name);

        setImages({
          front: project.frontImage ?? null,
          right: project.rightImage ?? null,
          top: project.topImage ?? null,
        });

        setBackground(project.background);
        setScale(project.scale);
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
   * Lock page scrolling while billing is open.
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
   * Close billing dialog with Escape.
   */
  useEffect(() => {
    if (!billing) return;

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
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
   * Upload artwork.
   */
  function upload(
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

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please select an image file.",
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setMessage(
          "Could not read the image.",
        );
        return;
      }

      setImages((current) => ({
        ...current,
        [face]: reader.result,
      }));

      setMessage("");
    };

    reader.onerror = () => {
      setMessage(
        "Could not read the image.",
      );
    };

    reader.readAsDataURL(file);
  }

  /*
   * Save project.
   */
  async function save() {
    if (saving) return;

    setSaving(true);
    setMessage("");

    try {
      const body = {
        name:
          name.trim() || "Untitled box",
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Could not save project.",
        );

        return;
      }

      if (!projectId) {
        const newProjectId =
          data.project?.id;

        if (newProjectId) {
          setProjectId(newProjectId);

          router.replace(
            `/editor?id=${newProjectId}`,
          );
        }
      }

      setMessage("Saved");
    } catch (error) {
      console.error(error);
      setMessage(
        "Could not save project.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Delete project.
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
        const data =
          await response
            .json()
            .catch(() => null);

        setMessage(
          data?.error ||
            "Could not delete project.",
        );

        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      setMessage(
        "Could not delete project.",
      );
    }
  }

  /*
   * Download PNG.
   */
  async function download() {
    if (downloading) return;

    if (!projectId) {
      setMessage(
        "Save the project before downloading.",
      );

      return;
    }

    setDownloading(true);
    setMessage("");

    try {
      const permissionResponse =
        await fetch("/api/downloads", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            projectId,
          }),
        });

      const permission =
        await permissionResponse.json();

      if (!permissionResponse.ok) {
        setMessage(
          permission.error ||
            "Download unavailable.",
        );

        if (
          permissionResponse.status ===
            402 ||
          permissionResponse.status ===
            429
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

      const safeName =
        name
          .replace(
            /[^a-z0-9]+/gi,
            "-",
          )
          .replace(
            /^-+|-+$/g,
            "",
          )
          .toLowerCase() ||
        "boxshot";

      const link =
        document.createElement("a");

      link.download = `${safeName}.png`;

      link.href =
        canvas.toDataURL(
          "image/png",
          1,
        );

      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage(
        permission.downloadLimit ===
          null
          ? "Downloaded — unlimited plan"
          : "Downloaded",
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Could not download the image.",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-slate-100">
        {/* HEADER */}
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/dashboard"
                className="shrink-0 rounded-lg p-2 hover:bg-slate-100"
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={18} />
              </Link>

              <div className="min-w-0">
                <input
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  className="w-48 bg-transparent font-bold outline-none sm:w-72"
                  placeholder="Untitled box"
                />

                <p className="text-xs text-slate-400">
                  3D BoxShot Editor
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} />

                {downloading
                  ? "Preparing…"
                  : "Download PNG"}
              </button>
            </div>
          </div>
        </header>

        {/* EDITOR */}
        <div className="mx-auto grid max-w-[1500px] gap-5 p-5 lg:grid-cols-[280px_1fr_280px]">
          {/* LEFT SIDEBAR */}
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
                frontFileRef.current?.click()
              }
            />

            <input
              ref={frontFileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                upload(
                  "front",
                  event.target.files?.[0],
                );

                event.currentTarget.value =
                  "";
              }}
            />

            <Face
              name="Right side"
              value={images.right}
              onClick={() =>
                rightFileRef.current?.click()
              }
            />

            <input
              ref={rightFileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                upload(
                  "right",
                  event.target.files?.[0],
                );

                event.currentTarget.value =
                  "";
              }}
            />

            <Face
              name="Top"
              value={images.top}
              onClick={() =>
                topFileRef.current?.click()
              }
            />

            <input
              ref={topFileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                upload(
                  "top",
                  event.target.files?.[0],
                );

                event.currentTarget.value =
                  "";
              }}
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

              <span className="mt-1 block text-xs font-normal text-slate-400">
                {scale.toFixed(2)}x
              </span>
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
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600"
              >
                <Trash2 size={16} />
                Delete project
              </button>
            )}
          </aside>

          {/* CENTER CANVAS */}
          <section className="order-1 min-h-[620px] lg:order-2">
            <div
              ref={canvasWrap}
              className="h-[620px] overflow-hidden rounded-3xl"
              style={{
                background,
              }}
            >
              <BoxScene
                images={{
                  front:
                    images.front ?? null,
                  right:
                    images.right ?? null,
                  top:
                    images.top ?? null,
                }}
                scale={scale}
              />
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
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

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Save projects for free. A
              subscription is required to
              export PNG downloads.
            </p>

            <button
              type="button"
              onClick={() =>
                setBilling(true)
              }
              className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition hover:border-indigo-400 hover:bg-indigo-50"
            >
              View plans
            </button>

            {message && (
              <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm">
                {message}
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* BILLING DIALOG */}
      {billing && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setBilling(false);
            }
          }}
        >
          <div className="relative my-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b bg-white px-5 py-5 sm:px-8 sm:py-6">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  Choose a plan
                </h2>

                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  Choose the download plan that
                  works for your BoxShot
                  projects.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBilling(false)
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close plans"
              >
                <X size={22} />
              </button>
            </div>

            <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-5 sm:p-8">
              <BillingCards />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
      className="mt-4 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:border-indigo-400 hover:bg-slate-50"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
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