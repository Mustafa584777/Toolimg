'use client';

import { CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import { useState } from 'react';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deliveredMode, setDeliveredMode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        deliveredVia?: string;
        mailtoUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      if (data.deliveredVia === 'mailto' && data.mailtoUrl) {
        window.location.href = data.mailtoUrl;
      }

      setDeliveredMode(data.deliveredVia ?? 'relay');
      setSubmitted(true);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to send message right now.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-8 border-t border-[#F3F4F6] pt-7">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-[#F97316]" aria-hidden="true" />
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#111827]">
          Send a Message
        </h2>
      </div>

      {submitted ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#059669]/25 bg-[#ECFDF5] p-4 text-sm text-[#065F46]">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
          <div>
            <p className="font-semibold">Message sent</p>
            <p className="mt-1 text-xs">
              {deliveredMode === 'mailto'
                ? `Thank you, ${name}. Your email app has been opened to finish sending your message, and we will reply to ${email}.`
                : `Thank you, ${name}. Your message has been dispatched and we will reply to ${email} shortly.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setDeliveredMode(null);
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
                className="block text-xs font-medium text-[#4B5563]"
              >
                Your Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="mt-1.5 h-10 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 text-sm text-[#111827] focus:border-[#F97316] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs font-medium text-[#4B5563]"
              >
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 h-10 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 text-sm text-[#111827] focus:border-[#F97316] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="block text-xs font-medium text-[#4B5563]"
            >
              Message
            </label>
            <textarea
              id="contact-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about the tool, bug, or feature request..."
              className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3 text-sm text-[#111827] focus:border-[#F97316] focus:bg-white focus:outline-none"
            />
          </div>

          {formError && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSending}
            className="btn-orange-gradient inline-flex min-h-[42px] items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all disabled:opacity-60"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isSending ? 'Sending...' : 'Send Message'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
