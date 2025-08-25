"use client";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
      setMessage("Thanks! We'll be in touch.");
      setEmail("");
      setName("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again later.");
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section>
          <h1>CHOPPED</h1>
          <p>Modern cooking collaboration platform.</p>
        </section>
        <section>
          <h2>Join the early list</h2>
          <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <button disabled={status === "submitting"}>
              {status === "submitting" ? "Signing up..." : "Sign up"}
            </button>
          </form>
          {message && <p>{message}</p>}
        </section>
      </main>
    </div>
  );
}
