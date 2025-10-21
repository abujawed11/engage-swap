import React from 'react';
import Card from '../components/ui/Card';
import BackButton from '../components/ui/BackButton';
import PageSEO from '../components/PageSEO';

export default function Refund() {
  return (
    <>
      <PageSEO
        title="Refund Policy | EngageSwap"
        description="Learn how refunds are handled for purchases on EngageSwap."
        canonicalPath="/refund"
      />


      <div className="max-w-4xl mx-auto space-y-8">
        <BackButton />

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Refund and Cancellation Policy</h1>
          <p className="text-slate-600">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <Card>
          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">1. Overview</h2>
              <p className="text-slate-700 leading-relaxed">
                At EngageSwap, we strive to provide fair and transparent services to all our users. This Refund and
                Cancellation Policy outlines the circumstances under which refunds may be issued for coin purchases
                and campaign expenditures.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">2. Coin Pack Purchases</h2>
              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">2.1 General Policy</h3>
              <p className="text-slate-700 leading-relaxed">
                All coin pack purchases are generally final and non-refundable once the transaction is completed and
                coins are credited to your account. However, we will consider refund requests in the following
                exceptional circumstances:
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">2.2 Eligible Refund Scenarios</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Duplicate Transactions:</strong> If you were charged multiple times for the same purchase
                  due to a technical error</li>
                <li><strong>Payment Error:</strong> If payment was deducted from your account but coins were not
                  credited within 24 hours</li>
                <li><strong>Incorrect Amount:</strong> If you were charged an amount different from the displayed price</li>
                <li><strong>Technical Glitch:</strong> If a system malfunction prevented you from using purchased coins</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">2.3 Non-Refundable Situations</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                Refunds will NOT be issued in the following cases:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>Change of mind after successful purchase and coin credit</li>
                <li>Coins have already been used to fund campaigns</li>
                <li>Account suspension or termination due to Terms of Service violations</li>
                <li>User error in selecting the wrong coin pack</li>
                <li>Dissatisfaction with campaign results or engagement quality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">3. Campaign Cancellations and Refunds</h2>
              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">3.1 Campaign Deletion by User</h3>
              <p className="text-slate-700 leading-relaxed">
                When you delete an active campaign, any unused coins (remaining budget for unserved clicks) will be
                automatically refunded to your account balance. These refunded coins can be used to create new
                campaigns or remain in your account.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">3.2 Campaign Removed by EngageSwap</h3>
              <p className="text-slate-700 leading-relaxed">
                If we remove your campaign due to policy violations, fraudulent activity, or prohibited content,
                we reserve the right to retain all coins spent on that campaign. However, if a campaign is removed
                due to a technical error on our part, unused coins will be fully refunded.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">3.3 Campaign Pausing</h3>
              <p className="text-slate-700 leading-relaxed">
                You may pause your campaign at any time without penalty. Unused coins remain in your campaign
                budget and will be used when you resume the campaign. No refund is processed for paused campaigns
                unless you explicitly delete the campaign.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">4. Earning-Related Issues</h2>
              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">4.1 Earned Coins Not Credited</h3>
              <p className="text-slate-700 leading-relaxed">
                If you completed a campaign visit and quiz but coins were not credited to your account, please
                contact support within 7 days of the visit. We will investigate and credit the appropriate coins
                if the issue is verified.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">4.2 Coin Deductions</h3>
              <p className="text-slate-700 leading-relaxed">
                If coins are incorrectly deducted from your account due to a system error, we will restore the
                coins after verification. However, coins deducted for legitimate reasons (campaign funding,
                policy violations) will not be refunded.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">5. Refund Request Process</h2>
              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">5.1 How to Request a Refund</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                To request a refund, follow these steps:
              </p>
              <ol className="list-decimal pl-6 text-slate-700 space-y-2">
                <li>Log in to your EngageSwap account</li>
                <li>Navigate to the "Support" section or use our <a href="/contact" className="text-teal-600
                hover:underline">Contact form</a></li>
                <li>Select "Refund Request" as the issue type</li>
                <li>Provide transaction details (transaction ID, date, amount)</li>
                <li>Explain the reason for your refund request with supporting evidence (screenshots, receipts)</li>
                <li>Submit the request</li>
              </ol>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">5.2 Processing Time</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li><strong>Request Review:</strong> 2-3 business days to review your refund request</li>
                <li><strong>Approval Notification:</strong> You will be notified via email about the decision</li>
                <li><strong>Refund Processing:</strong> 5-7 business days for approved refunds to reflect in your
                  original payment method</li>
                <li><strong>In-Account Credits:</strong> Immediate for refunds issued as coins to your EngageSwap
                  account</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">5.3 Refund Method</h3>
              <p className="text-slate-700 leading-relaxed">
                Refunds will be issued to the original payment method used for the purchase. If the original method
                is no longer available, we may issue the refund as coins to your EngageSwap account at your discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">6. Cancellation Policy</h2>
              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">6.1 Order Cancellation</h3>
              <p className="text-slate-700 leading-relaxed">
                You may cancel a coin pack order within 1 hour of purchase if the coins have not been used. To
                cancel, contact support immediately with your transaction ID. Cancellations are processed on a
                case-by-case basis.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">6.2 Campaign Cancellation</h3>
              <p className="text-slate-700 leading-relaxed">
                You can cancel (delete) your campaign at any time. Unused coins will be refunded automatically to
                your account. Already served visits will not be refunded.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">6.3 Account Cancellation</h3>
              <p className="text-slate-700 leading-relaxed">
                If you wish to close your account, please contact support. Remaining coin balance will be forfeited
                unless you have an active withdrawal request (if applicable). Closed accounts cannot be reopened,
                and no refunds will be issued for forfeited coins.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">7. Chargebacks and Disputes</h2>
              <p className="text-slate-700 leading-relaxed">
                If you initiate a chargeback or payment dispute with your bank or payment provider without first
                contacting our support team, your account may be suspended pending resolution. Fraudulent chargebacks
                may result in permanent account termination. We encourage you to contact us first to resolve any
                payment issues.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">8. Exceptions and Special Cases</h2>
              <p className="text-slate-700 leading-relaxed">
                EngageSwap reserves the right to make exceptions to this policy in extraordinary circumstances.
                Each refund request is evaluated individually, and decisions are made at our sole discretion while
                considering fairness to all parties involved.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">9. Changes to This Policy</h2>
              <p className="text-slate-700 leading-relaxed">
                We may update this Refund and Cancellation Policy from time to time. Changes will be posted on this
                page with an updated "Last Updated" date. Your continued use of EngageSwap after such changes
                constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">10. Contact Us</h2>
              <p className="text-slate-700 leading-relaxed">
                For refund requests or questions about this policy, please contact:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-3">
                <p className="text-slate-700"><strong>EngageSwap</strong></p>
                <p className="text-slate-700">Email: <a href="mailto:refunds@engageswap.in"
                  className="text-teal-600 hover:underline">refunds@engageswap.in</a></p>
                <p className="text-slate-700">Support: <a href="mailto:support@engageswap.in"
                  className="text-teal-600 hover:underline">support@engageswap.in</a></p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </>
  );
}
