import React from 'react';
import Card from '../components/ui/Card';
import BackButton from '../components/ui/BackButton';

export default function Cookies() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton />

      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Cookie Policy</h1>
        <p className="text-slate-600">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      <Card>
        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">1. What Are Cookies?</h2>
            <p className="text-slate-700 leading-relaxed">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you
              visit a website. They help websites recognize your device and remember information about your visit,
              such as your preferences and login status. Cookies are widely used to make websites work more
              efficiently and provide a better user experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">2. How EngageSwap Uses Cookies</h2>
            <p className="text-slate-700 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience on our platform, analyze
              usage patterns, and improve our services. Cookies help us remember your login session, preferences,
              and provide personalized content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">3. Types of Cookies We Use</h2>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">3.1 Essential Cookies</h3>
            <p className="text-slate-700 leading-relaxed">
              These cookies are necessary for the website to function properly. They enable core functionality such
              as security, authentication, and session management. You cannot opt out of these cookies as the
              website would not work without them.
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Authentication tokens for logged-in users</li>
              <li>Session identifiers to maintain your login state</li>
              <li>Security cookies to prevent fraud and protect user accounts</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">3.2 Functional Cookies</h3>
            <p className="text-slate-700 leading-relaxed">
              These cookies allow us to remember choices you make (such as language preferences) and provide
              enhanced, personalized features.
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>User preferences and settings</li>
              <li>Recently viewed campaigns</li>
              <li>UI customization options</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">3.3 Analytics Cookies</h3>
            <p className="text-slate-700 leading-relaxed">
              We use analytics cookies to understand how visitors interact with our website, which pages are most
              popular, and how users navigate through the site. This data helps us improve our platform.
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Page view tracking</li>
              <li>User behavior analysis</li>
              <li>Performance monitoring</li>
              <li>Error tracking and debugging</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">3.4 Performance Cookies</h3>
            <p className="text-slate-700 leading-relaxed">
              These cookies collect information about how you use our website, such as which pages you visit most
              often and any error messages you receive. They help us optimize the performance and speed of our
              platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">4. Third-Party Cookies</h2>
            <p className="text-slate-700 leading-relaxed">
              We may use third-party services that set their own cookies on your device. These services help us
              analyze traffic, process payments, and provide additional functionality.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">Third-Party Services We Use:</h3>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li><strong>Payment Processors (Razorpay):</strong> For secure payment processing</li>
              <li><strong>Analytics Providers:</strong> To understand user behavior and improve our platform</li>
              <li><strong>CDN Providers:</strong> To deliver content faster and more reliably</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              We do not control these third-party cookies. Please refer to their respective privacy and cookie
              policies for more information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">5. How Long Do Cookies Last?</h2>
            <p className="text-slate-700 leading-relaxed mb-2">
              Cookies can be either session cookies or persistent cookies:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li><strong>Session Cookies:</strong> Temporary cookies that are deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you manually
                delete them. We use persistent cookies for login sessions and user preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">6. Managing and Deleting Cookies</h2>
            <p className="text-slate-700 leading-relaxed mb-2">
              You have the right to control and manage cookies. Here's how:
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">6.1 Browser Settings</h3>
            <p className="text-slate-700 leading-relaxed">
              Most browsers allow you to control cookies through their settings. You can set your browser to block
              or alert you about cookies. However, blocking essential cookies may affect website functionality.
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">6.2 Opt-Out Tools</h3>
            <p className="text-slate-700 leading-relaxed">
              You can opt out of analytics and advertising cookies through your browser settings or by using
              third-party opt-out tools.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">6.3 Impact of Disabling Cookies</h3>
            <p className="text-slate-700 leading-relaxed">
              Disabling cookies may limit your ability to use certain features of our platform, such as staying
              logged in, saving preferences, or accessing personalized content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">7. Do Not Track (DNT)</h2>
            <p className="text-slate-700 leading-relaxed">
              Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want
              to be tracked. Currently, there is no industry-wide standard for DNT, and we do not respond to DNT
              signals at this time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">8. Local Storage and Similar Technologies</h2>
            <p className="text-slate-700 leading-relaxed">
              In addition to cookies, we may use local storage (HTML5) and other browser storage mechanisms to
              store user preferences, cache data, and improve performance. These technologies function similarly
              to cookies and can be managed through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">9. Updates to This Policy</h2>
            <p className="text-slate-700 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in technology, legal
              requirements, or our practices. The updated policy will be posted on this page with a revised
              "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">10. Your Consent</h2>
            <p className="text-slate-700 leading-relaxed">
              By using EngageSwap, you consent to the use of cookies as described in this policy. If you do not
              agree with our use of cookies, you should adjust your browser settings or refrain from using our
              platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">11. Contact Us</h2>
            <p className="text-slate-700 leading-relaxed">
              If you have questions about our use of cookies, please contact us:
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
  );
}
