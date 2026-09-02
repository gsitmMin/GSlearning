"use client";
/** 로그인 — FR-A-01. 이후 그룹웨어 SSO 버튼이 이 화면에 추가된다. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email, password);
      router.replace(user.mustChangePassword ? "/?pw=1" : "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page" style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <form onSubmit={submit} className="card" style={{ width: 380, maxWidth: "100%", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ marginBottom: 6 }}>
          <span className="wordmark" style={{ fontSize: 20 }}>GSITM Learning<span className="dot">.</span></span>
          <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>사내 계정으로 로그인하세요.</p>
        </div>
        <label style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
          이메일
          <input className="search-input" style={{ width: "100%", borderRadius: "var(--radius-sm)", marginTop: 4 }}
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
          비밀번호
          <input className="search-input" style={{ width: "100%", borderRadius: "var(--radius-sm)", marginTop: 4 }}
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="form-error" style={{ padding: 0 }}>{error}</p>}
        <button className="btn primary" disabled={busy} style={{ marginTop: 4 }}>
          {busy ? "확인 중…" : "로그인"}
        </button>
        <p style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          데모 계정 — 관리자 admin@gsitm.com / 학습자 jiwon.kim@gsitm.com
        </p>
      </form>
    </main>
  );
}
