"use client";

import { useState } from "react";

const fields = [
  ["name", "Name", "text"],
  ["email", "Email", "email"],
  ["phone", "Phone", "tel"],
  ["businessType", "Business type", "text"],
] as const;

export function ContactForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Sending...");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      event.currentTarget.reset();
      setStatus("Message sent. We will get back to you soon.");
    } else {
      setStatus("Could not send message. Please try WhatsApp or email.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-[#e5e5e5] bg-white p-6">
      {fields.map(([name, label, type]) => (
        <label key={name} className="mb-4 block">
          <span className="mb-2 block text-sm font-medium">{label}</span>
          <input
            className="w-full rounded-md border border-[#e5e5e5] bg-white px-4 py-3 outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100"
            name={name}
            required={name === "name" || name === "email"}
            type={type}
          />
        </label>
      ))}
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Message</span>
        <textarea
          className="min-h-36 w-full rounded-md border border-[#e5e5e5] bg-white px-4 py-3 outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100"
          name="message"
          required
        />
      </label>
      <button
        className="mt-5 w-full rounded-md bg-[#0a0a0a] py-3 text-sm font-medium text-white disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? "Sending..." : "Send Message"}
      </button>
      {status ? <p className="mt-3 text-center text-sm text-[#525252]">{status}</p> : null}
    </form>
  );
}
