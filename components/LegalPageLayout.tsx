'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail, Send, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { LegalPageSpec } from '@/lib/legal-pages';

export function LegalPageLayout({ page }: { page: LegalPageSpec }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError('Please fill in your name, email address, and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <section className="bg-[#F8FAFC] py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to toolimg.online</span>
        </Link>

        <article className="mt-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-9">
          <div className="border-b border-[#E2E8F0] pb-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>toolimg.online Policy &amp; Info</span>
              </span>
              <span className="font-mono text-xs text-[#64748B]">
                Updated {page.updatedAt}
              </span>
            </div>

            <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              {page.title}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-[#475569] sm:text-base">
              {page.summary}
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {page.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[#0F172A] sm:text-lg">
                  {section.heading}
                </h2>
                <div className="mt-2 space-y-2.5 text-sm leading-relaxed text-[#475569]">
                  {section.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#475569]">
                    {section.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {page.showContactForm && (
            <div className="mt-8 border-t border-[#E2E8F0] pt-7">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0F172A]">
                  Send a Message
                </h2>
              </div>

              {submitted ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#059669]/25 bg-[#ECFDF5] p-4 text-sm text-[#065F46]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
                  <div>
                    <p className="font-semibold">Message received</p>
                    <p className="mt-1 text-xs">
                      Thank you, {name}. Our team will follow up at {email} shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setName('');
                        setEmail('');
                        setMessage('');
                      }}
                      className="mt-3 text-xs font-medium text-[#059669] underline"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-medium text-[#475569]"
                      >
                        Your Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Aarav Sharma"
                        className="mt-1.5 h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-medium text-[#475569]"
                      >
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1.5 h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-medium text-[#475569]"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about the tool, bug, or feature request..."
                      className="mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {formError && (
                    <p className="text-xs font-medium text-red-600" role="alert">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
