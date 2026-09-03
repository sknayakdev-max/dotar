"use client";

import { useState } from "react";

const DEVICE_TYPES = [
  { label: "Laptop", value: "LAPTOP" },
  { label: "Desktop PC", value: "DESKTOP" },
  { label: "Gaming PC", value: "GAMING_PC" },
  { label: "Monitor", value: "MONITOR" },
  { label: "Printer", value: "PRINTER" },
  { label: "Graphics Card", value: "GRAPHICS_CARD" },
  { label: "Motherboard", value: "MOTHERBOARD" },
  { label: "Storage (HDD/SSD)", value: "SSD" },
  { label: "RAM / Memory", value: "RAM" },
  { label: "Power Supply", value: "POWER_SUPPLY" },
  { label: "Other", value: "OTHER" },
];

export default function RequestServicePage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    deviceType: "LAPTOP",
    brand: "",
    model: "",
    problemDescription: "",
    preferredContact: "PHONE",
  });

  const [requestId, setRequestId] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          email: form.email || null,
          deviceType: form.deviceType,
          brand: form.brand || null,
          model: form.model || null,
          problemDescription: form.problemDescription,
          preferredContact: form.preferredContact,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit request.");
      }

      if (data?.request?.requestNumber) {
        setRequestId(data.request.requestNumber);
      } else {
        setRequestId(data?.request?.id || `REQ-${Date.now().toString(36).toUpperCase()}`);
      }
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "An error occurred while submitting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">FREE DIAGNOSIS · CLEAR ESTIMATES</p>
          <h1>Request a repair</h1>
          <p>Tell us about your device. We’ll review the issue and call you back.</p>
        </div>
      </section>

      <section className="content-section">
        <div className="container narrow-container">
          <div className="form-card">
            {sent ? (
              <div className="success-message">
                <h2>Request received</h2>
                <p>
                  Your request <strong>{requestId}</strong> has been created. We’ll contact you shortly to discuss the repair.
                </p>
                <button
                  className="primary-action"
                  onClick={() => setSent(false)}
                  type="button"
                >
                  Send another request
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="service-form">
                {error && <div className="dashboard-alert">{error}</div>}
                
                <div className="form-grid">
                  <Field
                    label="Full name *"
                    id="customerName"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    required
                  />
                  <Field
                    label="Phone number *"
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Field
                  label="Email address (Optional)"
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required={false}
                />

                <label htmlFor="deviceType">
                  Device type *
                  <select
                    id="deviceType"
                    name="deviceType"
                    required
                    value={form.deviceType}
                    onChange={handleChange}
                  >
                    {DEVICE_TYPES.map((device) => (
                      <option key={device.value} value={device.value}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-grid">
                  <Field
                    label="Brand (Optional)"
                    id="brand"
                    name="brand"
                    placeholder="e.g. Dell, HP, Asus"
                    value={form.brand}
                    onChange={handleChange}
                  />
                  <Field
                    label="Model (Optional)"
                    id="model"
                    name="model"
                    placeholder="e.g. XPS 15, Pavilion"
                    value={form.model}
                    onChange={handleChange}
                  />
                </div>

                <label htmlFor="problemDescription">
                  Describe the issue *
                  <textarea
                    id="problemDescription"
                    name="problemDescription"
                    required
                    value={form.problemDescription}
                    onChange={handleChange}
                    placeholder="Tell us what is happening with your device…"
                  />
                </label>

                <label htmlFor="preferredContact">
                  Preferred contact method
                  <select
                    id="preferredContact"
                    name="preferredContact"
                    value={form.preferredContact}
                    onChange={handleChange}
                  >
                    <option value="PHONE">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </label>

                <button className="primary-action" disabled={loading} type="submit">
                  {loading ? "Submitting…" : "Submit service request"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  id,
  name,
  type = "text",
  placeholder = "",
  value,
  required = false,
  onChange,
}: {
  label: string;
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  required?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
    </label>
  );
}