// app/(public)/layout.tsx
import Image from "next/image";
import Link from "next/link";

import PublicAuthLink from "@/components/public-auth-link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site flex flex-col min-h-screen">
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="Dotar Sojat Computer home">
            <Image
              src="/dotar_logo.png"
              alt="Dotar Sojat Computer logo"
              width={40}
              height={40}
              className="brand-logo"
              priority
            />
            <span className="brand-name">
              Dotar Sojat <span>Computer</span>
            </span>
          </Link>

          <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/services">Services</Link>
            <Link href="/track-repair">Track Repair</Link>
            <Link href="/request-service">Request Service</Link>
          </nav>

          <div className="header-actions">
            <PublicAuthLink />
            <Link href="/request-service" className="header-button">
              Request a Repair
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        <div className="container footer-grid">
          {/* Company Bio */}
          <div className="footer-company">
            <Link href="/" className="footer-brand">
              <Image
                src="/dotar_logo.png"
                alt="Dotar Sojat Computer logo"
                width={36}
                height={36}
                className="footer-brand-logo"
              />
              <strong>Dotar Sojat Computer</strong>
            </Link>
            <p>
              Hardware repair for laptops, desktops and components.
              Honest diagnosis, clear estimates, no surprises.
            </p>
          </div>

          {/* Contact Details */}
          <div className="footer-column">
            <h3>Contact</h3>
            <p>☎ +91 98765 43210</p>
            <p>✉ service@dotarsojatcomputer.in</p>
            <p>⌖ Hill Patna, Ram Nagar, Brahmapur, Odisha 760005</p>
          </div>

          {/* Business Hours */}
          <div className="footer-column">
            <h3>Business hours</h3>
            <p>
              Monday – Saturday
              <br />
              10:00 AM – 8:00 PM
            </p>
            <p>
              Sunday
              <br />
              11:00 AM – 4:00 PM
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h3>Quick links</h3>
            <Link href="/services">Services</Link>
            <Link href="/request-service">Request service</Link>
            <Link href="/track-repair">Track a repair</Link>
            <Link href="/login">Staff login</Link>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="footer-bottom">
          © {new Date().getFullYear()} Dotar Sojat Computer. All rights reserved.
        </div>
      </footer>
    </div>
  );
}