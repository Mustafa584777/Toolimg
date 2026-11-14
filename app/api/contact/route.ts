import { NextRequest, NextResponse } from 'next/server';

const RECIPIENT_EMAIL =
  process.env.CONTACT_TO_EMAIL || 'iphone15covers@gmail.com';

interface ContactPayload {
  name?: string;
  email?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    const message = (body.message ?? '').trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Please provide your name, email address, and message.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // 1. Primary path: Resend transactional email API when configured
    if (process.env.RESEND_API_KEY) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'toolimg.online Contact <onboarding@resend.dev>',
          to: [RECIPIENT_EMAIL],
          reply_to: email,
          subject: `[toolimg.online] Contact message from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        }),
      });

      if (resendRes.ok) {
        return NextResponse.json({
          ok: true,
          deliveredVia: 'resend',
        });
      }
    }

    // 2. Secondary path: FormSubmit server-side relay to recipient
    try {
      const relayRes = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(RECIPIENT_EMAIL)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Referer: process.env.APP_URL || 'https://toolimg.online',
          },
          body: JSON.stringify({
            name,
            email,
            message,
            _subject: `[toolimg.online] Contact message from ${name}`,
            _template: 'table',
          }),
          signal: AbortSignal.timeout(5000),
        }
      );

      if (relayRes.ok) {
        const relayData = (await relayRes.json()) as { success?: string | boolean };
        if (relayData.success === true || relayData.success === 'true') {
          return NextResponse.json({
            ok: true,
            deliveredVia: 'relay',
          });
        }
      }
    } catch {
      // Fall through to client mailto handoff
    }

    // 3. Fallback: client-side mailto dispatch (does not expose address in static page text)
    const subject = encodeURIComponent(`[toolimg.online] Contact from ${name}`);
    const mailBody = encodeURIComponent(
      `Name: ${name}\nReply-To: ${email}\n\n${message}`
    );
    return NextResponse.json({
      ok: true,
      deliveredVia: 'mailto',
      mailtoUrl: `mailto:${RECIPIENT_EMAIL}?subject=${subject}&body=${mailBody}`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to send your message right now. Please try again.' },
      { status: 500 }
    );
  }
}
