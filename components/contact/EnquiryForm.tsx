"use client";

import { useState } from "react";

export default function EnquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [agree, setAgree] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Name, email and message are required.");
      return;
    }
    if (!agree) {
      setError("Please agree so we can reply.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setError(json.error || "Could not send. Try again.");
        return;
      }
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
      setAgree(false);
    } catch {
      setStatus("error");
      setError("Could not send. Check your connection and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-base font-medium text-foreground">Message received.</p>
        <p className="mt-1 text-sm text-foreground-muted">We will reply to the email you provided.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 text-left">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="enq-name">Name</label>
        <input id="enq-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Your name" maxLength={120} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="enq-email">Email</label>
        <input id="enq-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="you@email.com" maxLength={200} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="enq-message">Message</label>
        <textarea id="enq-message" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[140px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="How can we help?" maxLength={4000} />
      </div>
      <label className="flex items-start gap-2.5 text-sm text-foreground-muted">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
        <span>I agree that Powfolio may use this form to reply. We do not sell enquiry data.</span>
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={status === "sending"} className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {status === "sending" ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
