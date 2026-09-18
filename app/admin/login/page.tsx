"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ALLOWED_ADMIN_EMAIL = "patientira79@gmail.com"; // Your exact email
const MAX_ATTEMPTS = 2;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lock time

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is locked out on load
    const lockUntil = localStorage.getItem("admin_lock_until");
    if (lockUntil && Date.now() < parseInt(lockUntil)) {
      setIsLocked(true);
      setErrorMsg("Too many failed attempts. Locked for 15 minutes.");
    } else {
      localStorage.removeItem("admin_lock_until");
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (isLocked) {
      setErrorMsg("Account locked due to 2 failed attempts. Try again later.");
      return;
    }

    // 1. Check if email matches your allowed email
    if (email.trim().toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      setErrorMsg("Access denied. This email is not authorized for Admin.");
      return;
    }

    setLoading(true);

    // 2. Authenticate with Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const attempts = parseInt(localStorage.getItem("failed_admin_attempts") || "0") + 1;
      localStorage.setItem("failed_admin_attempts", attempts.toString());

      if (attempts >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + LOCK_TIME_MS;
        localStorage.setItem("admin_lock_until", lockTime.toString());
        setIsLocked(true);
        setErrorMsg("Maximum 2 failed attempts reached. Locked for 15 minutes.");
      } else {
        setErrorMsg(`Invalid credentials. Attempt ${attempts} of ${MAX_ATTEMPTS}.`);
      }
      setLoading(false);
    } else {
      // Clear attempts on success
      localStorage.removeItem("failed_admin_attempts");
      localStorage.removeItem("admin_lock_until");
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1322] flex items-center justify-center p-4 font-sans">
      <form
        onSubmit={handleLogin}
        className="bg-[#141c2e] p-8 rounded-2xl border border-slate-800 w-full max-w-md space-y-5 shadow-2xl"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-400">
            Kigali Shoes Hub
          </h1>
          <p className="text-slate-400 text-xs mt-1">Admin Dashboard Access</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg font-medium">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            disabled={isLocked}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="patientira79@gmail.com"
            className="w-full bg-[#0d1322] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            disabled={isLocked}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#0d1322] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading || isLocked}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition disabled:opacity-50"
        >
          {loading ? "Authenticating..." : isLocked ? "Locked (15 min)" : "Login to Admin"}
        </button>
      </form>
    </div>
  );
}