"use client";

import { useState } from "react";
import { Download, Eraser, Image as ImageIcon, LoaderCircle, Sparkles, Upload } from "lucide-react";

type ImageStudioProps = {
  onDone: (message: string) => void;
};

type ProcessedImage = {
  url?: string;
  publicId?: string;
};

export function ImageStudio({ onDone }: ImageStudioProps) {
  const [busy, setBusy] = useState<"" | "upload" | "remove" | "generate">("");
  const [image, setImage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [prompt, setPrompt] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessedImage | null>(null);

  async function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      onDone("Choose a JPG, PNG or WEBP image.");
      return;
    }
    setFilename(selected.name.replace(/\.[^.]+$/, ""));
    setFile(selected);
    setResult(null);
    setImage(await fileToDataUrl(selected));
    onDone("");
  }

  async function removeImageBackground() {
    if (!file) {
      onDone("Choose or generate an image first.");
      return;
    }
    setBusy("remove");
    setProgress(0);
    setResult(null);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const cutout = await removeBackground(file, {
        output: { format: "image/png" },
        progress: (_key, current, total) => setProgress(total ? Math.round((current / total) * 100) : 0),
      });
      const cutoutFile = new File([cutout], `${filename || "product"}-cutout.png`, { type: "image/png" });
      setFile(cutoutFile);
      setFilename(`${filename || "product"}-cutout`);
      setImage(await fileToDataUrl(cutoutFile));
      onDone("Background removed locally. Your image was not sent to a background-removal API.");
    } catch {
      onDone("Background removal could not load on this device. Check the connection and try again.");
    } finally {
      setBusy("");
      setProgress(0);
    }
  }

  async function generateImage() {
    if (prompt.trim().length < 12) {
      onDone("Describe the product scene in at least 12 characters.");
      return;
    }
    setBusy("generate");
    setResult(null);
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.image?.dataUrl) throw new Error(data.error || "Image generation failed.");
      const generatedFile = await dataUrlToFile(data.image.dataUrl, `ai-product-${Date.now()}.jpg`);
      setFile(generatedFile);
      setFilename(`ai-product-${Date.now()}`);
      setImage(data.image.dataUrl);
      onDone("AI product image generated. Review it before saving.");
    } catch (error) {
      onDone(error instanceof Error ? error.message : "Image generation failed.");
    } finally {
      setBusy("");
    }
  }

  async function uploadImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!image) {
      onDone("Choose or generate an image first.");
      return;
    }
    setBusy("upload");
    setResult(null);
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, filename: filename || "product-image" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Image processing failed.");
      setResult(data.image || null);
      onDone("Image resized to 1000 x 1000 and saved.");
    } catch (error) {
      onDone(error instanceof Error ? error.message : "Image processing failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.75fr)]">
      <form onSubmit={uploadImage} className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600">Product image lab</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Polish marketplace images</h2>
            <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-500">Remove backgrounds locally, preview the result, then save a clean 1000 x 1000 image.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-extrabold text-emerald-700">
            <Eraser className="h-3.5 w-3.5" /> Keyless BG removal
          </span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="group grid min-h-64 cursor-pointer place-items-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40">
            {image ? (
              // Local/generated preview; data URLs are intentionally rendered before upload.
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Selected product preview" className="max-h-72 w-full rounded-2xl object-contain" src={image} />
            ) : (
              <span>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-indigo-600 shadow-sm"><ImageIcon className="h-6 w-6" /></span>
                <span className="mt-4 block text-sm font-extrabold text-slate-900">Choose a product image</span>
                <span className="mt-1 block text-[10px] font-semibold text-slate-500">JPG, PNG or WEBP</span>
              </span>
            )}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} />
          </label>

          <div className="space-y-3">
            <label className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Output name
              <input className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold normal-case tracking-normal text-slate-900 outline-none focus:border-indigo-400" value={filename} onChange={(event) => setFilename(event.target.value)} placeholder="product-image" />
            </label>
            <button type="button" onClick={removeImageBackground} disabled={Boolean(busy) || !file} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              {busy === "remove" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
              {busy === "remove" ? `Removing${progress ? ` ${progress}%` : "..."}` : "Remove background"}
            </button>
            <button disabled={Boolean(busy) || !image} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              {busy === "upload" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {busy === "upload" ? "Saving..." : "Resize & save"}
            </button>
            {image ? <a href={image} download={`${filename || "product-image"}.png`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-extrabold text-indigo-600 hover:bg-indigo-50"><Download className="h-3.5 w-3.5" /> Download preview</a> : null}
          </div>
        </div>

        {result?.url ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <span>Production image saved successfully.</span>
            <a className="font-extrabold underline" href={result.url} target="_blank" rel="noreferrer">Open saved image</a>
          </div>
        ) : null}
      </form>

      <section className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#111827,#312e81)] p-5 shadow-[0_18px_45px_rgba(49,46,129,0.24)] sm:p-6">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-violet-200 ring-1 ring-white/15"><Sparkles className="h-5 w-5" /></span>
          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-violet-200">Optional free-tier provider</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-white">Generate a product scene</h2>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">Describe a clean ecommerce visual. Generation runs securely on the server, never inside the Chrome extension.</p>
          <label className="mt-6 grid gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
            Prompt
            <textarea className="min-h-36 resize-y rounded-2xl border border-white/10 bg-white/10 p-4 text-xs font-semibold normal-case leading-5 tracking-normal text-white outline-none placeholder:text-slate-400 focus:border-violet-300" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1200} placeholder="Example: premium studio photo of a navy cotton kurti on a warm beige background, soft shadow, front view" />
          </label>
          <button type="button" onClick={generateImage} disabled={Boolean(busy)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-xs font-black text-slate-950 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60">
            {busy === "generate" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-violet-600" />}
            {busy === "generate" ? "Generating..." : "Generate with AI"}
          </button>
          <p className="mt-3 text-[9px] font-semibold leading-4 text-slate-400">Requires server-side Cloudflare Workers AI credentials. No secret is exposed to the browser.</p>
        </div>
      </section>
    </div>
  );
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}
