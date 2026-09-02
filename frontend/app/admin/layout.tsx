"use client";
/** 관리자 — 좌측 LNB + 콘텐츠 2단 (PRD §6.3 골격) */
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENUS = [
  { group: "현황", items: [{ href: "/admin", label: "대시보드" }] },
  {
    group: "콘텐츠",
    items: [
      { href: "/admin/library", label: "Vimeo 라이브러리" },
      { href: "/admin/segments", label: "챕터 편집기" },
      { href: "/admin/planned/contents", label: "콘텐츠 관리" },
    ],
  },
  {
    group: "학습 운영",
    items: [
      { href: "/admin/planned/courses", label: "과정 구성" },
      { href: "/admin/planned/assignments", label: "배정" },
      { href: "/admin/planned/employees", label: "직원" },
      { href: "/admin/planned/audit", label: "감사 로그" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <main className="page">
      <div className="admin-layout">
        <nav className="card lnb" aria-label="관리자 메뉴">
          {MENUS.map((g) => (
            <div key={g.group} style={{ display: "contents" }}>
              <span className="group">{g.group}</span>
              {g.items.map((m) => (
                <Link key={m.href} href={m.href} className={path === m.href ? "active" : ""}>
                  {m.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </main>
  );
}
