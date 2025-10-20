import React from 'react';
import Card from '../components/ui/Card';
import BackButton from '../components/ui/BackButton';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton />

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms and Conditions</h1>
        <p className="text-slate-600">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      <Card>
        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-slate-700 leading-relaxed">
              By accessing and using EngageSwap ("the Platform"), you accept and agree to be bound by these Terms and
              Conditions. If you do not agree to these terms, please do not use our Services. These terms constitute
              a legally binding agreement between you and EngageSwap.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">2. Definitions</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>"Platform"</strong> refers to the EngageSwap website and all associated services</li>
              <li><strong>"User"</strong> refers to any person who accesses or uses the Platform</li>
              <li><strong>"Earner"</strong> refers to users who participate in campaigns to earn coins</li>
              <li><strong>"Promoter"</strong> refers to users who create campaigns to promote content</li>
              <li><strong>"Coins"</strong> refers to the virtual currency used on the Platform</li>
              <li><strong>"Campaign"</strong> refers to promotional content created by promoters</li>
              <li><strong>"Services"</strong> refers to all features and functionalities provided by EngageSwap</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">3. Eligibility</h2>
            <p className="text-slate-700 leading-relaxed mb-2">
              To use our Services, you must:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into a binding contract</li>
              <li>Provide accurate and complete registration information</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction</li>
              <li>Not be suspended or banned from using the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">4. User Accounts</h2>
            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">4.1 Account Registration</h3>
            <p className="text-slate-700 leading-relaxed">
              You must create an account to access most features of the Platform. You agree to provide accurate,
              current, and complete information during registration and to update such information as necessary.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">4.2 Account Security</h3>
            <p className="text-slate-700 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account. You must notify us immediately of any unauthorized use
              of your account.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">4.3 Account Termination</h3>
            <p className="text-slate-700 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms,
              fraudulent activity, or any other reason we deem necessary to protect the Platform and its users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">5. Coins and Virtual Currency</h2>
            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">5.1 Nature of Coins</h3>
            <p className="text-slate-700 leading-relaxed">
              Coins are virtual currency with no monetary value outside the Platform. Coins cannot be exchanged
              for cash, transferred to other users (except through Platform features), or redeemed for real-world
              goods or services except as explicitly provided by EngageSwap.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">5.2 Earning Coins</h3>
            <p className="text-slate-700 leading-relaxed">
              Earners can accumulate coins by visiting campaigns, watching content for the required duration, and
              successfully completing quiz questions. Coin rewards are based on quiz performance as determined by
              our algorithm.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">5.3 Purchasing Coins</h3>
            <p className="text-slate-700 leading-relaxed">
              Users may purchase coin packs through our payment partners. All purchases are final and non-refundable
              except as required by law or specified in our Refund Policy.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">5.4 Using Coins</h3>
            <p className="text-slate-700 leading-relaxed">
              Promoters use coins to fund campaigns. The cost per visit depends on watch duration and other
              campaign parameters. Unused coins remain in your account and do not expire unless your account
              is terminated for violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">6. Campaign Rules</h2>
            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">6.1 Promoter Obligations</h3>
            <p className="text-slate-700 leading-relaxed mb-2">
              As a promoter, you agree to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Provide accurate campaign information and valid URLs</li>
              <li>Ensure your promoted content complies with all applicable laws</li>
              <li>Not promote illegal, harmful, offensive, or fraudulent content</li>
              <li>Create fair and answerable quiz questions related to your content</li>
              <li>Not manipulate or game the system to gain unfair advantages</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">6.2 Earner Obligations</h3>
            <p className="text-slate-700 leading-relaxed mb-2">
              As an earner, you agree to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Genuinely engage with campaign content</li>
              <li>Watch content for the full required duration</li>
              <li>Answer quiz questions honestly based on the content</li>
              <li>Not use automated tools, bots, or scripts to participate in campaigns</li>
              <li>Not create multiple accounts to earn coins unfairly</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">6.3 Campaign Management</h3>
            <p className="text-slate-700 leading-relaxed">
              We reserve the right to pause, modify, or remove any campaign that violates our policies or community
              guidelines. Remaining budget from removed campaigns will be refunded to the promoter's account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">7. Prohibited Activities</h2>
            <p className="text-slate-700 leading-relaxed mb-2">
              You may not:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Engage in fraudulent or deceptive practices</li>
              <li>Use automated tools or bots to interact with the Platform</li>
              <li>Attempt to hack, reverse engineer, or compromise Platform security</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Upload malware, viruses, or malicious code</li>
              <li>Scrape or collect user data without authorization</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Manipulate campaign results or coin earnings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">8. Intellectual Property</h2>
            <p className="text-slate-700 leading-relaxed">
              All content on the Platform, including text, graphics, logos, software, and functionality, is the
              property of EngageSwap or its licensors and is protected by copyright, trademark, and other
              intellectual property laws. You may not use, copy, or distribute any Platform content without
              our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">9. Disclaimers and Limitations of Liability</h2>
            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">9.1 Service Availability</h3>
            <p className="text-slate-700 leading-relaxed">
              The Platform is provided "as is" and "as available" without warranties of any kind. We do not
              guarantee uninterrupted, error-free, or secure access to our Services.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">9.2 Limitation of Liability</h3>
            <p className="text-slate-700 leading-relaxed">
              To the maximum extent permitted by law, EngageSwap shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the Platform, even if we have
              been advised of the possibility of such damages.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">9.3 Third-Party Content</h3>
            <p className="text-slate-700 leading-relaxed">
              We are not responsible for content promoted through campaigns or third-party websites linked from
              our Platform. Users access such content at their own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">10. Indemnification</h2>
            <p className="text-slate-700 leading-relaxed">
              You agree to indemnify and hold harmless EngageSwap, its officers, directors, employees, and agents
              from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your
              use of the Platform, violation of these Terms, or infringement of any rights of third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">11. Dispute Resolution</h2>
            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">11.1 Governing Law</h3>
            <p className="text-slate-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard
              to its conflict of law provisions.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">11.2 Jurisdiction</h3>
            <p className="text-slate-700 leading-relaxed">
              Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive
              jurisdiction of the courts located in [Your City], India.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">11.3 Arbitration</h3>
            <p className="text-slate-700 leading-relaxed">
              We encourage users to resolve disputes amicably through our support team before pursuing legal action.
              If resolution cannot be achieved, disputes may be referred to arbitration as per the Arbitration and
              Conciliation Act, 1996.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">12. Modifications to Terms</h2>
            <p className="text-slate-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective upon posting on the
              Platform with an updated "Last Updated" date. Continued use of the Platform after such changes
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">13. Severability</h2>
            <p className="text-slate-700 leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions
              shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">14. Contact Information</h2>
            <p className="text-slate-700 leading-relaxed">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-3">
              <p className="text-slate-700"><strong>EngageSwap</strong></p>
              <p className="text-slate-700">Email: <a href="mailto:legal@engageswap.in"
                className="text-teal-600 hover:underline">legal@engageswap.in</a></p>
              <p className="text-slate-700">Support: <a href="mailto:support@engageswap.in"
                className="text-teal-600 hover:underline">support@engageswap.in</a></p>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
}
