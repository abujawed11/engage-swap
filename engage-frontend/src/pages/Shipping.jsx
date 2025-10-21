import PageSEO from "../components/PageSEO";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Shipping() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageSEO
        title="Shipping & Delivery Policy — EngageSwap"
        description="EngageSwap delivers digital coins and services instantly to your account. No physical shipping is required."
        canonicalPath="/shipping"
      />

      {/* Header */}
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-700">
          <span className="h-2 w-2 rounded-full bg-teal-600" /> Policy
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900">
          Shipping & Delivery Policy
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
          EngageSwap is a digital platform. We do <b>not</b> ship physical goods. 
          All credits/coins and services are delivered online to your account.
        </p>
      </header>

      {/* Quick facts */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-teal-200 bg-white p-5">
          <div className="text-2xl">⚡</div>
          <h3 className="mt-2 font-semibold text-slate-900">Instant Delivery</h3>
          <p className="text-slate-600 text-sm">
            Coins are credited immediately after a successful payment and verification.
          </p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-white p-5">
          <div className="text-2xl">🌐</div>
          <h3 className="mt-2 font-semibold text-slate-900">Digital Only</h3>
          <p className="text-slate-600 text-sm">
            No courier or postal shipping. Everything is fulfilled online.
          </p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-white p-5">
          <div className="text-2xl">🛡️</div>
          <h3 className="mt-2 font-semibold text-slate-900">Secure</h3>
          <p className="text-slate-600 text-sm">
            Payments are processed securely. Delivery is tied to your registered account.
          </p>
        </div>
      </section>

      {/* Main policy */}
      <Card>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Policy Details</h2>
        <div className="prose max-w-none prose-p:my-3 prose-li:my-1 prose-headings:scroll-mt-20">
          <h3 className="text-slate-900">1) Nature of Service</h3>
          <p className="text-slate-700">
            EngageSwap provides digital services and virtual coins that can be used on the
            platform to run campaigns or access features. As a result, there is no physical
            shipment involved.
          </p>

          <h3 className="text-slate-900">2) Delivery Timeline</h3>
          <ul className="list-disc pl-5 text-slate-700">
            <li>On successful payment, coins are credited <b>instantly</b>.</li>
            <li>If payment confirmation is delayed by your bank or provider,
                crediting may take up to <b>10 minutes</b>.</li>
          </ul>

          <h3 className="text-slate-900">3) Order/Delivery Confirmation</h3>
          <p className="text-slate-700">
            You can verify coin balance in your <b>Wallet</b> and payment entries in
            <b> Transactions / Receipts</b> inside the app. Email receipts may also be sent.
          </p>

          <h3 className="text-slate-900">4) Failed or Delayed Delivery</h3>
          <p className="text-slate-700">
            If coins are not visible within 10 minutes after a successful charge, 
            please contact us with your payment reference. We’ll investigate and resolve promptly.
          </p>

          <h3 className="text-slate-900">5) Address & Shipping Charges</h3>
          <p className="text-slate-700">
            Not applicable. There are no shipping addresses or shipping fees for EngageSwap services.
          </p>

          <h3 className="text-slate-900">6) Refunds</h3>
          <p className="text-slate-700">
            Refunds are governed by our <a className="text-teal-700 underline" href="/refund">Refund Policy</a>.
          </p>

          <h3 className="text-slate-900">7) Support</h3>
          <p className="text-slate-700">
            For any delivery concerns, email us at{" "}
            <a className="text-teal-700 underline" href="mailto:support@engageswap.in">
              support@engageswap.in
            </a>.
          </p>
        </div>
      </Card>

      {/* Contact CTA */}
      <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center">
        <h3 className="text-xl font-semibold">Need help with a recent payment?</h3>
        <p className="text-emerald-50 mt-1">
          Reach us with your Order ID / Payment Reference and we’ll sort it quickly.
        </p>
        <a href="mailto:support@engageswap.in">
          <Button className="mt-4 bg-white text-emerald-700 hover:bg-emerald-50">
            Email Support
          </Button>
        </a>
      </section>

      {/* Helpful JSON-LD for automated verifiers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DeliveryTimeSettings",
            "name": "EngageSwap Digital Delivery",
            "transitTimeLabel": "Instant Digital Delivery",
            "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 10, "unitCode": "MIN" }
          }),
        }}
      />
    </div>
  );
}
