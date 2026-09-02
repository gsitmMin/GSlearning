"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, hasSession, logout, type UserView } from "@/lib/api";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/catalog", label: "카탈로그" },
  { href: "/my", label: "내 학습" },
  { href: "/history", label: "이력" },
];

export default function Header() {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserView | null>(null);

  // 미로그인 가드 — 로그인 화면 외에는 세션 필요
  useEffect(() => {
    if (path === "/login") return;
    if (!hasSession()) {
      router.replace("/login");
      return;
    }
    setUser(getUser());
  }, [path, router]);

  if (path === "/login") return null;

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  const isAdmin = user?.roles.includes("ADMIN");

  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="wordmark">
          GSITM Learning<span className="dot">.</span>
        </Link>
        <nav className="gnb" aria-label="주 메뉴">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={isActive(n.href) ? "active" : ""}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          {isAdmin && (
            <Link href="/admin" className={`admin-link ${path.startsWith("/admin") ? "active" : ""}`}>
              관리자
            </Link>
          )}
          {user && (
            <span className="profile-chip">
              <span className="avatar">{user.name[0]}</span>
              {user.name}
              <span className="org"> · {user.organization.split(" ")[0]}</span>
            </span>
          )}
          <button className="admin-link" onClick={() => void logout()} style={{ border: 0, background: "none" }}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
