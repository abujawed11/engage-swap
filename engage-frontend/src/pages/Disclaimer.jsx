import React from 'react';
import Card from '../components/ui/Card';
import BackButton from '../components/ui/BackButton';

export default function Disclaimer() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton />

      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Disclaimer</h1>
        <p className="text-slate-600">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      <Card>
        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">1. General Disclaimer</h2>
            <p className="text-slate-700 leading-relaxed">
              The information and services provided by EngageSwap ("EngageSwap," "we," "us," or "our") on this
              website are for general informational and promotional purposes only. While we strive to provide
              accurate and up-to-date information, we make no representations or warranties of any kind, express or
              implied, about the completeness, accuracy, reliability, suitability, or availability of the website or
              the information, products, services, or related graphics contained on the website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">2. Third-Party Content Disclaimer</h2>
            <p className="text-slate-700 leading-relaxed">
              EngageSwap acts as a platform connecting promoters with earners. We do not create, control, endorse,
              or verify the content promoted through campaigns on our platform. The content, products, services,
              websites, and materials promoted by users are the sole responsibility of the respective promoters.
            </p>
            <p className="text-slate-700 leading-relaxed mt-3">
              We explicitly disclaim any responsibility or liability for:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>The accuracy, legality, or quality of third-party content</li>
              <li>Any harm, loss, or damage arising from third-party websites or services</li>
              <li>Fraudulent, misleading, or offensive content promoted through campaigns</li>
              <li>Viruses, malware, or security issues on third-party websites</li>
              <li>Privacy practices of external websites</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">3. No Guarantees</h2>
            <p className="text-slate-700 leading-relaxed">
              EngageSwap does not guarantee:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Specific results or outcomes from using our platform</li>
              <li>The amount of traffic or engagement campaigns will receive</li>
              <li>The conversion rate or quality of visitors</li>
              <li>Earnings for users participating in campaigns</li>
              <li>Uninterrupted or error-free service availability</li>
              <li>That the platform will meet your specific requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">4. Use at Your Own Risk</h2>
            <p className="text-slate-700 leading-relaxed">
              Your use of EngageSwap and any third-party content accessed through our platform is entirely at your
              own risk. You are responsible for exercising caution and good judgment when interacting with promoted
              content. We recommend that users:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Verify the legitimacy of websites before providing personal information</li>
              <li>Use antivirus and security software when browsing</li>
              <li>Report suspicious or harmful content to our support team</li>
              <li>Read the privacy policies of third-party websites</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">5. Financial Disclaimer</h2>
            <p className="text-slate-700 leading-relaxed">
              EngageSwap is not a financial investment platform. Coins earned or purchased on our platform have no
              monetary value outside the platform and cannot be redeemed for cash unless explicitly stated. Any
              references to "earning" or "rewards" refer to virtual coins within the EngageSwap ecosystem only.
            </p>
            <p className="text-slate-700 leading-relaxed mt-3">
              We do not provide financial, investment, legal, or tax advice. Users should consult appropriate
              professionals for such matters.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">6. Accuracy of Information</h2>
            <p className="text-slate-700 leading-relaxed">
              While we make every effort to ensure that information on our website is accurate and current, errors
              may occur. We reserve the right to correct any errors, inaccuracies, or omissions and to change or
              update information at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">7. No Professional Advice</h2>
            <p className="text-slate-700 leading-relaxed">
              The content on EngageSwap is not intended to be a substitute for professional advice. We are not
              responsible for any decisions you make based on information provided on our platform. Always seek
              the advice of qualified professionals regarding specific questions or concerns.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">8. External Links</h2>
            <p className="text-slate-700 leading-relaxed">
              Our website may contain links to external websites that are not operated or controlled by us. We have
              no control over and assume no responsibility for the content, privacy policies, or practices of any
              third-party sites or services. We do not warrant the offerings of any of these entities/individuals
              or their websites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">9. Limitation of Liability</h2>
            <p className="text-slate-700 leading-relaxed">
              In no event shall EngageSwap, its officers, directors, employees, or agents be liable for any direct,
              indirect, incidental, special, consequential, or punitive damages arising out of or related to your
              use of the platform, including but not limited to loss of data, profits, or business opportunities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">10. Changes to This Disclaimer</h2>
            <p className="text-slate-700 leading-relaxed">
              We reserve the right to modify this disclaimer at any time. Changes will be effective immediately upon
              posting to the website. Your continued use of the platform after such modifications constitutes your
              acknowledgment and acceptance of the updated disclaimer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">11. Governing Law</h2>
            <p className="text-slate-700 leading-relaxed">
              This disclaimer is governed by the laws of India. Any disputes arising from this disclaimer or your
              use of the platform shall be subject to the exclusive jurisdiction of the courts in Hyderabad, India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">12. Contact Information</h2>
            <p className="text-slate-700 leading-relaxed">
              If you have questions about this disclaimer, please contact us:
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
