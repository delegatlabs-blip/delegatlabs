"use client";

import { useState } from "react";
import { contactIntro, contactForm, offices } from "@/data/contact";
import { SectionHeading } from "@/components/section-heading";
import { Toast } from "@/components/toast";
// import { LazyReCAPTCHA } from "@/components/LazyReCAPTCHA";

interface ContactSectionProps {
  intro?: typeof contactIntro;
  formLabels?: typeof contactForm;
  officesData?: typeof offices;
}

export function ContactSection({
  intro = contactIntro,
  formLabels = contactForm,
  officesData = offices,
}: ContactSectionProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    countryCode: "India (+91)",
    phone: "",
    service: "AI Agents Marketplace",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: "Message sent successfully!", type: "success" });
        setFormData({
          fullName: "",
          email: "",
          countryCode: "India (+91)",
          phone: "",
          service: "AI Agents Marketplace",
          message: "",
        });
      } else {
        setToast({ message: data.message || "Something went wrong.", type: "error" });
      }
    } catch {
      setToast({ message: "Server error. Please try again later.", type: "error" });
    }

    setLoading(false);
  };

  return (
    <section className="section-padding bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent mb-3">
            Get in touch
          </p>
          <SectionHeading title={intro.title} subtitle={intro.subtitle} />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          {/* Form */}
          <div className="card p-6 md:p-8">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Name */}
              <div>
                <label htmlFor="contact-fullName" className="block text-sm font-medium text-slate-700">
                  {formLabels.nameLabel}
                </label>
                <input
                  id="contact-fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700">
                  {formLabels.emailLabel}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                />
              </div>

              {/* Country Code */}
              <div>
                <label htmlFor="contact-countryCode" className="block text-sm font-medium text-slate-700">
                  {formLabels.countryLabel}
                </label>
                <select
                  id="contact-countryCode"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                >
                  <option>India (+91)</option>
                  <option>United States (+1)</option>
                  <option>United Kingdom (+44)</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700">
                  {formLabels.mobileLabel}
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                />
              </div>

              {/* Services */}
              <div>
                <label htmlFor="contact-service" className="block text-sm font-medium text-slate-700">
                  {formLabels.servicesLabel}
                </label>
                <select
                  id="contact-service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                >
                  <option>AI Agents Marketplace</option>
                  <option>LinkedIn Growth Agent</option>
                  <option>Content Writer Agent</option>
                  <option>Lead Gen Agent</option>
                  <option>Support Reply Agent</option>
                  <option>Custom Agent Workflow</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700">
                  {formLabels.messageLabel}
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                />
              </div>
              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-60"
                data-cursor-exclude
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? "Sending…" : formLabels.submitLabel}
                  {!loading && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Offices */}
          <div className="space-y-8">
            {officesData.map((office) => (
              <div key={office.id} className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  {office.country}
                </h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-slate-500">Office Phone</dt>
                    <dd>
                      <a
                        href={`tel:${office.phone.replace(/\s/g, "")}`}
                        className="text-primary-700 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:rounded"
                      >
                        {office.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Location</dt>
                    <dd className="text-slate-700">{office.address}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${office.email}`}
                        className="text-primary-700 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:rounded"
                      >
                        {office.email}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
