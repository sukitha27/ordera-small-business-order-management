import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

const LAST_UPDATED = "April 29, 2026";
const COMPANY = "Velora Technologies";
const ADDRESS = "Nugegoda, Sri Lanka";
const EMAIL = "legal@veloratech.com.lk";
const APP_NAME = "Ordera";
const APP_URL = "https://ordera.veloratech.com.lk";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-foreground">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple nav */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg">
            {APP_NAME}
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-16 max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            This Privacy Policy explains how {COMPANY} ("we", "us", "our") collects,
            uses, and protects information when you use {APP_NAME} ({APP_URL}).
          </p>
        </div>

        <Section title="1. Who We Are">
          <p>
            {APP_NAME} is an order management platform for Sri Lankan online businesses,
            operated by {COMPANY}, located at {ADDRESS}.
          </p>
          <p>
            If you have questions about this policy, contact us at{" "}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">
              {EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect the following information when you use {APP_NAME}:</p>

          <div className="mt-2 space-y-4">
            <div>
              <p className="font-medium text-foreground mb-1">Account information</p>
              <p>
                Your email address and password (stored securely via Supabase Auth).
                We never store your password in plain text.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">Business profile</p>
              <p>
                Business name, owner name, phone number, address, and city — provided
                by you when setting up your account.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">Order data</p>
              <p>
                Customer names, phone numbers, delivery addresses, order details,
                payment status, and waybill numbers that you enter into the system.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">Payment slips</p>
              <p>
                Images of bank transfer slips uploaded by you or your customers for
                payment verification. These are stored securely and only accessible
                to your account.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">Usage data</p>
              <p>
                Anonymous page view data collected by Cloudflare Web Analytics.
                This is cookieless and does not track individual users across sites.
                No personal identifiers are collected.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">Technical data</p>
              <p>
                IP addresses and browser information may be processed by Cloudflare
                as part of delivering the service (CDN, DDoS protection, bot detection).
              </p>
            </div>
          </div>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Provide and operate the {APP_NAME} service</li>
            <li>Authenticate your account and keep it secure</li>
            <li>Store and display your orders, customers, and business data</li>
            <li>Process payment slip verification requests</li>
            <li>Send transactional emails (password reset, account notifications)</li>
            <li>Improve the platform based on usage patterns</li>
            <li>Respond to your support requests</li>
            <li>Enforce our Terms of Service</li>
          </ul>
          <p className="mt-3">
            We do <strong>not</strong> use your data for advertising, and we do{" "}
            <strong>not</strong> sell your data to any third party.
          </p>
        </Section>

        <Section title="4. Data Storage and Security">
          <p>
            Your data is stored on Supabase (PostgreSQL database and file storage),
            hosted on AWS infrastructure. All data is encrypted in transit (TLS) and
            at rest.
          </p>
          <p>
            Access to your data is protected by Row-Level Security (RLS) — meaning
            your business data is only accessible to users authenticated to your
            account. No other merchant can see your orders, customers, or files.
          </p>
          <p>
            We implement Cloudflare Turnstile (bot protection) on all authentication
            forms to prevent automated abuse.
          </p>
        </Section>

        <Section title="5. Data Sharing">
          <p>
            We share your data with the following third-party services, strictly to
            operate {APP_NAME}:
          </p>
          <div className="mt-2 space-y-3">
            <div>
              <p className="font-medium text-foreground">Supabase</p>
              <p>
                Database, authentication, and file storage provider. Your data is
                stored on Supabase's infrastructure. Supabase is GDPR-compliant.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Cloudflare</p>
              <p>
                CDN, DDoS protection, bot protection (Turnstile), and cookieless
                web analytics. Cloudflare processes IP addresses as part of normal
                internet traffic routing.
              </p>
            </div>
          </div>
          <p className="mt-3">
            We do <strong>not</strong> share your data with advertisers, data brokers,
            courier companies, or any other third parties.
          </p>
        </Section>

        <Section title="6. Your Customers' Data">
          <p>
            When you use {APP_NAME} to manage orders, you enter data about your customers
            (their names, phone numbers, addresses). You are the data controller for
            your customers' information. We process this data on your behalf as a
            data processor.
          </p>
          <p>
            You are responsible for ensuring you have a lawful basis for collecting
            and storing your customers' personal information, and for informing them
            about how their data is used.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p>
            We retain your data for as long as your account is active. When you
            request account deletion:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Your account is scheduled for deletion with a 30-day grace period</li>
            <li>You can cancel the deletion and recover your data within 30 days</li>
            <li>
              After 30 days, all your data is permanently deleted — including orders,
              customers, products, payment slips, and your login credentials
            </li>
            <li>This deletion is irreversible</li>
          </ul>
        </Section>

        <Section title="8. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>Access</strong> — request a copy of your personal data
            </li>
            <li>
              <strong>Correction</strong> — update your business profile via Settings
            </li>
            <li>
              <strong>Deletion</strong> — delete your account via Settings → Danger Zone
            </li>
            <li>
              <strong>Portability</strong> — export your order data via CSV export
            </li>
            <li>
              <strong>Objection</strong> — contact us to object to how we process
              your data
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email us at{" "}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">
              {EMAIL}
            </a>
            . We will respond within 14 days.
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            {APP_NAME} does not use tracking cookies. We use Cloudflare Web Analytics,
            which is fully cookieless and does not use browser storage to track users.
          </p>
          <p>
            Your authentication session is stored using a secure, HTTP-only cookie
            managed by Supabase Auth. This cookie is strictly necessary for the
            service to function and does not track you across other websites.
          </p>
        </Section>

        <Section title="10. Children's Privacy">
          <p>
            {APP_NAME} is intended for use by businesses and is not directed at children
            under 13. We do not knowingly collect personal data from children under 13.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we make material
            changes, we will update the "Last updated" date at the top of this page
            and notify active users via email or an in-app notice.
          </p>
          <p>
            Continued use of {APP_NAME} after changes are posted constitutes your
            acceptance of the updated policy.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            For privacy-related questions, data requests, or concerns, contact us at:
          </p>
          <div className="mt-2 p-4 rounded-lg border border-border bg-card text-sm">
            <p className="font-medium text-foreground">{COMPANY}</p>
            <p>{ADDRESS}</p>
            <p>
              <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">
                {EMAIL}
              </a>
            </p>
          </div>
        </Section>

        {/* Footer links */}
        <div className="border-t border-border pt-8 mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link to="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
        </div>
      </div>
    </div>
  );
}