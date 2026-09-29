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
import { useSearchParams, useRouter } from "next/navigation";
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

export default function EditorClient() {
  const params = useSearchParams();
  const router = useRouter();

  const canvasWrap = useRef<HTMLDivElement>(null);

  const fileRefs = {
    front: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
    top: useRef<HTMLInputElement>(null),
  };

  const [projectId, setProjectId] = useState(params.get("id"));
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

  // Controls the plans dialog.
  const [billing, setBilling] = useState(false);

  /*
   * Load existing project.
   */
  useEffect(() => {
    const id = params.get("id");

    if (!id) return;

    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const p: Project = d.project;

        if (!p) return;

        setProjectId(p.id);
        setName(p.name);

        setImages({
          front: p.frontImage ?? null,
          right: p.rightImage ?? null,
          top: p.topImage ?? null,
        });

        setBackground(p.background);
        setScale(p.scale);
      })
      .catch((error) => {
        console.error("Failed to load project:", error);
        setMessage("Could not load project.");
      });
  }, [params]);

  /*
   * Lock page scrolling while plans dialog is open.
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
   * Close plans dialog with Escape.
   */
  useEffect(() => {
    if (!billing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBilling(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [billing]);

  /*
   * Upload artwork.
   */
  async function upload(
    face: keyof FaceImages,
    file?: File,
  ) {
    if (!file) return;

    if (file.size > 3_000_000) {
      setMessage("Keep each artwork image below 3 MB.");
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

    reader.readAsDataURL(file);
  }

  /*
   * Save project.
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

      const res = await fetch(
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

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Could not save");
        setSaving(false);
        return;
      }

      if (!projectId) {
        setProjectId(data.project.id);

        router.replace(
          `/editor?id=${data.project.id}`,
        );
      }

      setMessage("Saved");
    } catch (error) {
      console.error(error);
      setMessage("Could not save project.");
    } finally {
      setSaving(false);
    }
  }

  /*
   * Delete project.
   */
  async function remove() {
    if (!projectId) return;

    if (!confirm("Delete this project?")) return;

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setMessage("Could not delete project.");
    }
  }

  /*
   * Download PNG.
   */
  async function download() {
    if (!projectId) {
      setMessage("Save the project before downloading.");
      return;
    }

    setDownloading(true);
    setMessage("");

    try {
      const permission = await fetch("/api/downloads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
        }),
      });

      const p = await permission.json();

      if (!permission.ok) {
        setMessage(
          p.error || "Download unavailable",
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
        setMessage("Preview is not ready yet.");
        return;
      }

      const link = document.createElement("a");

      link.download = `${
        name
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase() || "boxshot"
      }.png`;

      link.href = canvas.toDataURL(
        "image/png",
        1,
      );

      link.click();

      setMessage(
        p.downloadLimit === null
          ? "Downloaded — unlimited plan"
          : "Downloaded",
      );
    } catch (error) {
      console.error(error);
      setMessage("Could not download the image.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
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
                  onChange={(e) =>
                    setName(e.target.value)
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
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <Save size={16} />

                {saving ? "Saving…" : "Save"}
              </button>

              <button
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

        {/* EDITOR */}
        <div className="mx-auto grid max-w-[1500px] gap-5 p-5 lg:grid-cols-[280px_1fr_280px]">
          {/* LEFT SIDEBAR */}
          <aside className="order-2 rounded-2xl border bg-white p-5 lg:order-1">
            <h2 className="font-bold">
              Artwork
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Upload images for the visible faces.
            </p>

            {/* FRONT */}
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
              onChange={(e) =>
                upload(
                  "front",
                  e.target.files?.[0],
                )
              }
            />

            {/* RIGHT */}
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
              onChange={(e) =>
                upload(
                  "right",
                  e.target.files?.[0],
                )
              }
            />

            {/* TOP */}
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
              onChange={(e) =>
                upload(
                  "top",
                  e.target.files?.[0],
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
                onChange={(e) =>
                  setScale(
                    Number(e.target.value),
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
                onChange={(e) =>
                  setBackground(e.target.value)
                }
                className="mt-3 h-10 w-full cursor-pointer rounded-lg"
              />
            </label>

            {/* DELETE */}
            {projectId && (
              <button
                onClick={remove}
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-red-500"
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
              className="h-[620px] rounded-3xl overflow-hidden"
              style={{
                background,
              }}
            >
              <BoxScene
                images={{
                  front: images?.front ?? null,
                  right: images?.right ?? null,
                  top: images?.top ?? null,
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
              Save projects for free. A subscription
              is required to export PNG downloads.
            </p>

            {/* OPEN PLANS DIALOG */}
            <button
              onClick={() => setBilling(true)}
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

      {/* =====================================================
          FULL-SCREEN BILLING DIALOG
          ===================================================== */}
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
            {/* DIALOG HEADER */}
            <div className="flex items-start justify-between border-b bg-white px-5 py-5 sm:px-8 sm:py-6">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  Choose a plan
                </h2>

                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  Choose the download plan that works
                  for your BoxShot projects.
                </p>
              </div>

              <button
                onClick={() => setBilling(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close plans"
              >
                <X size={22} />
              </button>
            </div>

            {/* BILLING CARDS */}
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
      onClick={onClick}
      className="mt-4 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:border-indigo-400"
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