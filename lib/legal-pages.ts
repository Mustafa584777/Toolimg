export interface LegalPageSpec {
  slug:
    | 'privacy-policy'
    | 'terms'
    | 'contact'
    | 'refund-policy'
    | 'disclaimer'
    | 'about';
  title: string;
  metaTitle: string;
  metaDescription: string;
  updatedAt: string;
  summary: string;
  sections: {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
  showContactForm?: boolean;
}

const privacyPolicySpec: LegalPageSpec = {
  slug: 'privacy-policy',
  title: 'Privacy Policy',
  metaTitle: 'Privacy Policy | toolimg.online',
  metaDescription:
    'Learn how toolimg.online protects your privacy with client-side image processing and transparent data handling for AI vision tools.',
  updatedAt: 'November 13, 2026',
  summary:
    'toolimg.online is built around a privacy-first architecture. Local Canvas utilities never transmit your files to any server, and AI-assisted vision utilities process submitted images transiently without storing personal media.',
  sections: [
    {
      heading: '1. Client-Side Image Processing (Zero Uploads)',
      paragraphs: [
        'Core image tools—including KB compression, format conversion, EXIF metadata removal, circle cropping, grid splitting, Discord resizing, passport photo generation, HTML-to-image rendering, Base64 encoding, and color picking—run 100% inside your web browser via HTML5 Canvas and Web APIs.',
        'For all client-side tools, your files never leave your device memory and are never transmitted over the network.',
      ],
    },
    {
      heading: '2. AI Vision & OCR Tools',
      paragraphs: [
        'When you explicitly invoke an AI-assisted tool (/tools/handwriting-to-text/, /tools/hindi-handwriting-to-text/, /tools/image-to-code/, or /tools/gemini-image-to-prompt/), the selected image is sent securely over HTTPS to our server endpoint solely to perform the requested OCR, code generation, or prompt analysis.',
        'toolimg.online does not permanently store, index, sell, or publish uploaded images on our servers.',
      ],
    },
    {
      heading: '3. Cookies, Analytics & Logs',
      paragraphs: [
        'We do not require account sign-ups or personal profiles to use toolimg.online. Basic, non-identifying technical request metrics may be processed by our hosting infrastructure strictly to maintain uptime and prevent abuse.',
      ],
    },
    {
      heading: '4. Your Rights & Contact',
      paragraphs: [
        'If you have questions regarding privacy, data handling, or GDPR/CCPA inquiries, please reach out to support@toolimg.online or use our Contact page.',
      ],
    },
  ],
};

const termsSpec: LegalPageSpec = {
  slug: 'terms',
  title: 'Terms & Conditions',
  metaTitle: 'Terms & Conditions | toolimg.online',
  metaDescription:
    'Terms of service governing the use of toolimg.online browser image utilities, AI OCR tools, and generated outputs.',
  updatedAt: 'November 13, 2026',
  summary:
    'By accessing or using toolimg.online, you agree to the terms below covering acceptable use, intellectual property, and service availability.',
  sections: [
    {
      heading: '1. Acceptable Use',
      paragraphs: [
        'All tools on toolimg.online are provided free of charge for lawful personal, academic, and commercial workflows.',
        'You agree not to use automated scraping bots to overload API endpoints, attempt to bypass security controls, or process illegal or infringing content.',
      ],
    },
    {
      heading: '2. Ownership of Content',
      paragraphs: [
        'You retain 100% ownership and copyright over every image you process and every output file, extracted text, code snippet, or prompt generated using toolimg.online.',
      ],
    },
    {
      heading: '3. Verification of Outputs',
      paragraphs: [
        'While our compression, passport sizing, and OCR tools are engineered for high accuracy, you are responsible for verifying final outputs against third-party portal, printing, or legal specifications before submission.',
      ],
    },
    {
      heading: '4. Modifications to Service',
      paragraphs: [
        'We may update, enhance, or modify available tools and these Terms at any time without prior notice. Continued use of the site constitutes acceptance of the current Terms.',
      ],
    },
  ],
};

const contactSpec: LegalPageSpec = {
  slug: 'contact',
  title: 'Contact Us',
  metaTitle: 'Contact Us | toolimg.online',
  metaDescription:
    'Contact the toolimg.online team for feature requests, bug reports, passport spec suggestions, or business inquiries.',
  updatedAt: 'November 13, 2026',
  summary:
    'Have a question, bug report, or suggestion for a new image utility or exact-KB preset? Use the contact form below to reach our team directly.',
  showContactForm: true,
  sections: [
    {
      heading: 'How We Can Help',
      paragraphs: [
        'Use the message form below for tool suggestions, technical bug reports, passport size specification updates, or business inquiries.',
        'Note: Please do not submit sensitive personal IDs or private documents through the contact form.',
      ],
    },
  ],
};

const refundPolicySpec: LegalPageSpec = {
  slug: 'refund-policy',
  title: 'Refund Policy',
  metaTitle: 'Refund Policy | toolimg.online',
  metaDescription:
    'Refund and billing policy for toolimg.online. All core browser image tools are 100% free with no hidden subscriptions.',
  updatedAt: 'November 13, 2026',
  summary:
    'toolimg.online provides free access to its online image compression, conversion, OCR, and resizing utilities without mandatory subscriptions or paywalls.',
  sections: [
    {
      heading: '1. Free Forever Core Utilities',
      paragraphs: [
        'All standard client-side and web image utilities currently available on toolimg.online are free to use with no credit card required and no recurring charges.',
      ],
    },
    {
      heading: '2. Future Paid Plans & Pro Credits (If Applicable)',
      paragraphs: [
        'Should toolimg.online introduce optional Pro API tiers or commercial bulk packages in the future, eligible purchases will carry a transparent 7-day refund window if a technical issue prevents service delivery.',
      ],
    },
    {
      heading: '3. Billing Questions',
      paragraphs: [
        'If you ever believe an unauthorized charge occurred in connection with our domain or have billing questions, contact support@toolimg.online with your transaction reference for an immediate review.',
      ],
    },
  ],
};

const disclaimerSpec: LegalPageSpec = {
  slug: 'disclaimer',
  title: 'Disclaimer',
  metaTitle: 'Disclaimer | toolimg.online',
  metaDescription:
    'Important disclaimer regarding accuracy, AI OCR results, passport photo compliance, and third-party brand trademarks on toolimg.online.',
  updatedAt: 'November 13, 2026',
  summary:
    'Information and image utilities on toolimg.online are provided on an "as-is" and "as-available" basis for general productivity and creative workflows.',
  sections: [
    {
      heading: '1. Passport, Visa & Government Portal Compliance',
      paragraphs: [
        'Our passport photo presets (such as US 2x2" and UK 35x45mm) format aspect ratios and print sheets to published dimensions. Official acceptance depends on lighting, background uniformity, head positioning, and agency-specific rules.',
        'toolimg.online is not affiliated with any government agency and cannot guarantee official approval of submitted photographs.',
      ],
    },
    {
      heading: '2. AI OCR & Code Generation Accuracy',
      paragraphs: [
        'Outputs from Handwriting to Text, Hindi Handwriting to Text, Image to Code, and Image to Prompt rely on automated vision models. Always proofread transcribed text (especially numbers, names, and legal notes) and test generated code before production deployment.',
      ],
    },
    {
      heading: '3. Trademarks & Third-Party Names',
      paragraphs: [
        'References to platforms such as Instagram, Discord, Apple HEIC, or Gemini are solely descriptive to help users identify compatible formats and output specifications. All trademarks remain the property of their respective owners.',
      ],
    },
  ],
};

const aboutSpec: LegalPageSpec = {
  slug: 'about',
  title: 'About toolimg.online',
  metaTitle: 'About Us | toolimg.online',
  metaDescription:
    'Discover why we built toolimg.online: fast, privacy-first browser image tools with exact-KB compression, OCR, and creator utilities.',
  updatedAt: 'November 13, 2026',
  summary:
    'toolimg.online was created to replace slow, ad-heavy cloud uploaders with fast, precision-engineered browser utilities and smart vision workflows.',
  sections: [
    {
      heading: 'Our Mission',
      paragraphs: [
        'Simple image tasks shouldn’t require creating an account, waiting in server queues, or uploading private documents to unknown remote storage. Whenever a task can run locally via HTML5 Canvas and Web APIs, we execute it 100% on your device.',
      ],
    },
    {
      heading: 'What We Build',
      paragraphs: [
        'From exact 20KB/50KB portal compression and EXIF scrubbing to Hindi & English handwriting OCR, HTML-to-Image rendering, and UI screenshot-to-code conversion, every utility is designed for zero clutter and immediate output.',
      ],
      bullets: [
        'Zero-upload client-side Canvas processing for everyday compression, cropping, and conversion.',
        'High-accuracy multilingual OCR (including Devanagari Hindi handwriting) and UI-to-code tools.',
        'Exact dimension presets for US/UK passports, Discord emotes, and Instagram grids.',
      ],
    },
  ],
};

export const LEGAL_PAGES: Record<LegalPageSpec['slug'], LegalPageSpec> = {
  'privacy-policy': privacyPolicySpec,
  terms: termsSpec,
  contact: contactSpec,
  'refund-policy': refundPolicySpec,
  disclaimer: disclaimerSpec,
  about: aboutSpec,
};
