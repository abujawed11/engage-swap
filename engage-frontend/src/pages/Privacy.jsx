import React from 'react';
import Card from '../components/ui/Card';
import BackButton from '../components/ui/BackButton';
import PageSEO from '../components/PageSEO';

export default function Privacy() {
  return (
    <>
      <PageSEO
        title="Privacy Policy | EngageSwap"
        description="How EngageSwap collects, uses, and protects your data."
        canonicalPath="/privacy"
      />


      <div className="max-w-4xl mx-auto space-y-8">
        <BackButton />

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <Card>
          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">1. Introduction</h2>
              <p className="text-slate-700 leading-relaxed">
                EngageSwap ("we," "our," or "us") respects your privacy and is committed to protecting your personal
                data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
                you use our website and services (collectively, the "Services").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">2. Information We Collect</h2>
              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">2.1 Personal Information</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                We collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>Register for an account (username, email address, password)</li>
                <li>Create or participate in campaigns</li>
                <li>Complete transactions or purchase coin packs</li>
                <li>Contact our support team</li>
                <li>Subscribe to newsletters or marketing communications</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">2.2 Automatically Collected Information</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                When you use our Services, we automatically collect certain information, including:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, click patterns)</li>
                <li>Campaign interaction data (visit duration, quiz responses, engagement metrics)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">2.3 Financial Information</h3>
              <p className="text-slate-700 leading-relaxed">
                Payment information is processed securely through third-party payment processors (Razorpay). We do not
                store complete credit card or banking details on our servers. We may retain transaction IDs, payment
                status, and related metadata for record-keeping purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
              <p className="text-slate-700 leading-relaxed mb-2">
                We use collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>To provide, maintain, and improve our Services</li>
                <li>To process transactions and manage your account</li>
                <li>To match you with relevant campaigns (for earners)</li>
                <li>To display campaign analytics and performance metrics (for promoters)</li>
                <li>To detect and prevent fraud, abuse, and security incidents</li>
                <li>To communicate with you about service updates, promotions, and support</li>
                <li>To comply with legal obligations and enforce our Terms of Service</li>
                <li>To analyze usage patterns and optimize user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">4. Information Sharing and Disclosure</h2>
              <p className="text-slate-700 leading-relaxed mb-2">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf
                  (payment processing, email delivery, analytics)</li>
                <li><strong>Campaign Promoters:</strong> Aggregated and anonymized engagement metrics (no personal
                  identifiable information)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">5. Cookies and Tracking Technologies</h2>
              <p className="text-slate-700 leading-relaxed">
                We use cookies, web beacons, and similar technologies to enhance your experience, analyze usage, and
                deliver personalized content. You can control cookie preferences through your browser settings. However,
                disabling cookies may limit certain features of our Services. For more details, please refer to our
                <a href="/cookies" className="text-teal-600 hover:underline"> Cookie Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">6. Data Security</h2>
              <p className="text-slate-700 leading-relaxed">
                We implement industry-standard security measures to protect your information from unauthorized access,
                alteration, disclosure, or destruction. These measures include encryption, secure servers, access controls,
                and regular security audits. However, no method of transmission over the internet is 100% secure, and we
                cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">7. Data Retention</h2>
              <p className="text-slate-700 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this
                Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. When your
                data is no longer needed, we securely delete or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">8. Your Rights and Choices</h2>
              <p className="text-slate-700 leading-relaxed mb-2">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
                <li><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications at any time</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-3">
                To exercise these rights, please contact us at <a href="mailto:privacy@engageswap.in"
                  className="text-teal-600 hover:underline">privacy@engageswap.in</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">9. Third-Party Services</h2>
              <p className="text-slate-700 leading-relaxed">
                Our Services may contain links to third-party websites or integrate with third-party services. We are not
                responsible for the privacy practices of these external sites. We encourage you to review their privacy
                policies before providing any personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">10. Children's Privacy</h2>
              <p className="text-slate-700 leading-relaxed">
                Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal
                information from children. If we become aware that we have inadvertently collected data from a child, we
                will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">11. International Data Transfers</h2>
              <p className="text-slate-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than India. We ensure that such
                transfers comply with applicable data protection laws and implement appropriate safeguards to protect
                your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">12. Changes to This Privacy Policy</h2>
              <p className="text-slate-700 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal
                requirements. We will notify you of significant changes by posting the updated policy on our website and
                updating the "Last Updated" date. Continued use of our Services after such changes constitutes acceptance
                of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">13. Contact Us</h2>
              <p className="text-slate-700 leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
                please contact us:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-3">
                <p className="text-slate-700"><strong>EngageSwap</strong></p>
                <p className="text-slate-700">Email: <a href="mailto:privacy@engageswap.in"
                  className="text-teal-600 hover:underline">privacy@engageswap.in</a></p>
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
