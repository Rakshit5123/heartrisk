"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const TABS = [["/screen", "Screening"], ["/history", "History"], ["/evidence", "Model evidence"]];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="bar">
      <div className="wrap bar-in">
        <Link href="/" className="brand" aria-label="HeartRisk home"><Logo />HeartRisk</Link>
        <nav aria-label="Main">
          {TABS.map(([href, text]) => (
            <Link key={href} href={href} className={path === href ? "on" : ""} aria-current={path === href ? "page" : undefined}>{text}</Link>
          ))}
        </nav>
        <Link href="/screen" className="btn small">Start screening</Link>
      </div>
    </header>
  );
}
