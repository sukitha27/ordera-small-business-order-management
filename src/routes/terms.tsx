import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
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

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: {LAST_UPDATED}</p>
          <p className="text-muted-foreground text-sm mt-2">
            Please read these Terms of Service carefully before using {APP_NAME}. By
            creating an account or using the service, you agree to be bound by these terms.
          </p>
        </div>

        <Section title="1. About Ordera">
          <p>
            {APP_NAME} is an order management platform designed for Sri Lankan online
            businesses. It is operated by {COMPANY}, located at {ADDRESS}.
          </p>
          <p>
            {APP_NAME} is currently in beta. We are continuously improving the platform
            and features may change, be added, or be removed during this period.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>To use {APP_NAME}, you must:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Be at least 18 years old</li>
            <li>Be using the service for a legitimate business purpose</li>
            <li>Provide accurate information when creating your account</li>
            <li>Have the legal authority to enter into these terms on behalf of your business</li>
          </ul>
          <p className="mt-3">
            {APP_NAME} is intended for use by businesses operating in Sri Lanka. Use from
            other jurisdictions is permitted but we make no warranties that the service
            complies with laws in other countries.
          </p>
        </Section>

        <Section title="3. Account Responsibilities">
          <p>
            When you create an account, you are responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Keeping your password secure and not sharing it with others</li>
            <li>All activity that occurs under your account</li>
            <li>Notifying us immediately at{" "}
              <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>{" "}
              if you suspect unauthorized access
            </li>
            <li>Keeping your business profile information accurate and up to date</li>
          </ul>
          <p className="mt-3">
            We reserve the right to suspend or terminate accounts that show signs of
            unauthorized access or security compromise.
          </p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree to use {APP_NAME} only for lawful purposes. You must not:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Use the platform to manage fraudulent orders or deceive customers</li>
            <li>Enter false, misleading, or fabricated customer information</li>
            <li>Use the public order form to collect data without intending to fulfil orders</li>
            <li>Attempt to access another merchant's data or circumvent our security measures</li>
            <li>Use automated tools to scrape, spam, or abuse the platform</li>
            <li>Resell or sublicense access to {APP_NAME} to third parties</li>
            <li>Use the platform for any activity that violates Sri Lankan law</li>
            <li>Upload payment slips that are fraudulent, forged, or manipulated</li>
          </ul>
          <p className="mt-3">
            Violation of these terms may result in immediate account suspension without
            notice or refund.
          </p>
        </Section>

        <Section title="5. Plans, Limits, and Billing">
          <div className="space-y-3">
            <div>
              <p className="font-medium text-foreground mb-1">Free plan</p>
              <p>
                The Free plan is available indefinitely with no payment required.
                It includes up to 50 confirmed orders per calendar month.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Paid plans</p>
              <p>
                Paid plans (Starter, Growth, Business) are currently handled manually
                via WhatsApp. Pricing is in Sri Lankan Rupees (LKR) and is subject to
                change with 30 days notice.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Order limits</p>
              <p>
                Each plan has a monthly order limit. Limits reset on the 1st of each
                calendar month. When you reach your limit, new order creation is
                blocked until the next month or you upgrade your plan.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Public form inquiries</p>
              <p>
                Orders submitted via your public order form count as "inquiries" and
                do not count toward your monthly limit until you confirm them as real orders.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Refunds</p>
              <p>
                As billing is currently manual, refund requests are handled case by case.
                Contact us at{" "}
                <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>{" "}
                within 7 days of payment for refund requests.
              </p>
            </div>
          </div>
        </Section>

        <Section title="6. Your Data">
          <p>
            You own all data you enter into {APP_NAME} — including your orders, customer
            records, products, and uploaded files. We do not claim any ownership over
            your business data.
          </p>
          <p>
            You grant us a limited license to store, process, and display your data
            solely for the purpose of providing the {APP_NAME} service to you.
          </p>
          <p>
            You can export your order data at any time via the CSV export feature.
            You can delete your account and all associated data at any time via
            Settings → Danger Zone.
          </p>
        </Section>

        <Section title="7. Your Customers' Data">
          <p>
            When you use {APP_NAME} to manage customer orders, you are the data controller
            for your customers' personal information. You are responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Having a lawful basis for collecting your customers' personal data</li>
            <li>Informing your customers about how their data is stored and used</li>
            <li>
              Responding to any requests from your customers regarding their personal data
            </li>
            <li>Ensuring you use customer data only for legitimate order fulfilment purposes</li>
          </ul>
        </Section>

        <Section title="8. Service Availability">
          <p>
            We aim to keep {APP_NAME} available at all times, but we do not guarantee
            uninterrupted access. During the beta period in particular, the service
            may be unavailable for maintenance, updates, or unexpected issues.
          </p>
          <p>
            We will make reasonable efforts to notify users in advance of planned
            maintenance. We are not liable for any losses resulting from service
            downtime.
          </p>
        </Section>

        <Section title="9. Suspension and Termination">
          <div className="space-y-3">
            <div>
              <p className="font-medium text-foreground mb-1">By you</p>
              <p>
                You may delete your account at any time via Settings → Danger Zone.
                Your data will be scheduled for permanent deletion after a 30-day
                grace period, during which you can cancel the deletion and recover
                your account.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">By us</p>
              <p>
                We reserve the right to suspend or terminate your account if you
                violate these Terms of Service, engage in fraudulent activity, abuse
                other users, or fail to pay for a paid plan. We will provide notice
                where reasonably possible, except in cases of serious violations
                where immediate action is required.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Effect of termination</p>
              <p>
                Upon termination, your access to {APP_NAME} will cease. Your data
                will be retained for 30 days after termination, after which it will
                be permanently deleted.
              </p>
            </div>
          </div>
        </Section>

        <Section title="10. Intellectual Property">
          <p>
            {APP_NAME} and all its components — including the software, design, logo,
            and content created by us — are owned by {COMPANY} and protected by
            applicable intellectual property laws.
          </p>
          <p>
            You may not copy, modify, distribute, sell, or reverse engineer any part
            of {APP_NAME} without our written permission.
          </p>
          <p>
            Your business data, logo, and content remain your property. We do not
            claim ownership over anything you create or upload.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the maximum extent permitted by Sri Lankan law, {COMPANY} shall not be
            liable for:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Loss of revenue, profits, or business opportunities</li>
            <li>Loss of data (beyond what we can recover from our backups)</li>
            <li>
              Indirect, incidental, or consequential damages arising from your use
              of {APP_NAME}
            </li>
            <li>
              Actions taken by couriers, customers, or other third parties in connection
              with orders you manage through {APP_NAME}
            </li>
          </ul>
          <p className="mt-3">
            Our total liability to you for any claim arising from these terms or your
            use of {APP_NAME} shall not exceed the amount you paid us in the 3 months
            preceding the claim.
          </p>
        </Section>

        <Section title="12. Disclaimers">
          <p>
            {APP_NAME} is provided "as is" and "as available" without warranties of
            any kind, express or implied.
          </p>
          <p>
            We do not warrant that the service will be error-free, uninterrupted, or
            free of security vulnerabilities. We do not guarantee that courier integrations
            will always function correctly, as these depend on third-party APIs outside
            our control.
          </p>
          <p>
            During the beta period, features may be incomplete, changed, or removed
            without notice.
          </p>
        </Section>

        <Section title="13. Governing Law">
          <p>
            These Terms of Service are governed by the laws of Sri Lanka. Any disputes
            arising from these terms or your use of {APP_NAME} shall be subject to the
            exclusive jurisdiction of the courts of Sri Lanka.
          </p>
        </Section>

        <Section title="14. Changes to These Terms">
          <p>
            We may update these Terms of Service from time to time. When we make
            material changes, we will:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Update the "Last updated" date at the top of this page</li>
            <li>Notify active users via email or an in-app notice</li>
            <li>Give at least 14 days notice before changes take effect, where possible</li>
          </ul>
          <p className="mt-3">
            Continued use of {APP_NAME} after changes are posted constitutes your
            acceptance of the updated terms. If you disagree with any changes, you
            may delete your account before the changes take effect.
          </p>
        </Section>

        <Section title="15. Contact">
          <p>
            For questions about these Terms of Service, contact us at:
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
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
        </div>
      </div>
    </div>
  );
}