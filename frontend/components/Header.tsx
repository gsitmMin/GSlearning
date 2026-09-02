"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ME } from "@/lib/mock-data";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/catalog", label: "카탈로그" },
  { href: "/my", label: "내 학습" },
  { href: "/history", label: "이력" },
];

export default function Header() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
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
          <Link href="/admin" className={`admin-link ${path.startsWith("/admin") ? "active" : ""}`}>
            관리자
          </Link>
          <span className="profile-chip">
            <span className="avatar">{ME.name[0]}</span>
            {ME.name}
            <span className="org"> · {ME.organization.split(" ")[0]}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
