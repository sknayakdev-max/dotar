import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList,
  Search,
  Wrench,
  CircleCheck,
  ShieldCheck,
  Clock3,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Send a request",
    description: "Tell us the device and the fault. Takes a minute.",
  },
  {
    number: "02",
    icon: Search,
    title: "Free diagnosis",
    description: "We bench test and share a clear cost estimate.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Repair",
    description: "Approved work only, with genuine-grade parts.",
  },
  {
    number: "04",
    icon: CircleCheck,
    title: "Pickup",
    description: "Track status online and collect when it's ready.",
  },
];

const services = [
  {
    title: "Laptop Repair",
    description:
      "Motherboard, charging, overheating and no-boot faults fixed in-house.",
  },
  {
    title: "Desktop Repair",
    description:
      "Full desktop diagnosis, part replacement and performance tuning.",
  },
  {
    title: "Hardware Diagnosis",
    description:
      "Bench testing to find the exact failing component before you spend.",
  },
  {
    title: "SSD Upgrade",
    description:
      "Move from HDD to SSD with your data and Windows carried over.",
  },
  {
    title: "RAM Upgrade",
    description:
      "Compatible DDR3/DDR4/DDR5 modules fitted and stability tested.",
  },
  {
    title: "Screen Replacement",
    description:
      "Cracked, flickering or dead laptop displays replaced same day.",
  },
];

export default function HomePage() {
  return (
    <div className="site-content">
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <div className="eyebrow">SOJAT, RAJASTHAN 306104</div>

            <h1>
              Professional Computer
              <br />
              &amp; Laptop Repair
            </h1>

            <p className="hero-description">
              Fast, reliable hardware repair services for laptops, desktops
              and computer components — with honest diagnosis and clear
              estimates before any work starts.
            </p>

            <div className="hero-actions">
              <Link href="/request-service" className="primary-button">
                Request a Repair
              </Link>

              <Link href="/track-repair" className="secondary-button">
                Track Repair
              </Link>
            </div>

            <div className="hero-features">
              <div className="hero-feature">
                <ShieldCheck />
                <span>Warranty on parts</span>
              </div>

              <div className="hero-feature">
                <Clock3 />
                <span>Same-day common fixes</span>
              </div>

              <div className="hero-feature">
                <Search />
                <span>Free diagnosis</span>
              </div>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <Image
              src="/repair-hero.png"
              alt="Laptop being repaired on a professional repair bench"
              width={600}
              height={400}
              className="hero-image"
              priority
            />
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="how-section">
        <div className="container">
          <div className="section-heading">
            <h2>How it works</h2>
          </div>

          <div className="steps-grid">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div className="step-card" key={step.number}>
                  <div className="step-top">
                    <div className="step-icon">
                      <Icon />
                    </div>
                    <span className="step-number">{step.number}</span>
                  </div>

                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="services-section">
        <div className="container">
          <div className="services-header">
            <div>
              <h2>What we repair</h2>
              <p>
                Component-level work on every kind of personal computer.
              </p>
            </div>

            <Link href="/services" className="outline-button">
              See all services
            </Link>
          </div>

          <div className="services-grid">
            {services.map((service) => (
              <Link
                href="/services"
                className="service-card"
                key={service.title}
              >
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div>
              <h2>Device acting up?</h2>
              <p>
                Send a service request now — we&apos;ll review it and call you back.
              </p>
            </div>

            <Link href="/request-service" className="cta-button">
              Request Service
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}