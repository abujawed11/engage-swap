import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BackButton from '../components/ui/BackButton';
import { useNavigate } from 'react-router-dom';
import PageSEO from '../components/PageSEO';

export default function Support() {
  const navigate = useNavigate();

  const supportTopics = [
    {
      icon: "💰",
      title: "Earning Coins",
      description: "Learn how to browse campaigns, earn coins, and maximize your rewards",
      color: "blue"
    },
    {
      icon: "🚀",
      title: "Creating Campaigns",
      description: "Step-by-step guide to promoting your content and managing campaigns",
      color: "orange"
    },
    {
      icon: "💳",
      title: "Wallet & Payments",
      description: "Understanding coins, purchasing packs, and managing your balance",
      color: "green"
    },
    {
      icon: "📊",
      title: "Analytics & Tracking",
      description: "How to view and interpret your campaign performance data",
      color: "purple"
    },
    {
      icon: "⚙️",
      title: "Account Settings",
      description: "Managing your profile, security, and account preferences",
      color: "slate"
    },
    {
      icon: "🔒",
      title: "Safety & Rules",
      description: "Platform policies, prohibited content, and staying safe",
      color: "red"
    }
  ];

  const colorClasses = {
    blue: "from-blue-50 to-cyan-50 border-blue-200",
    orange: "from-orange-50 to-amber-50 border-orange-200",
    green: "from-green-50 to-emerald-50 border-green-200",
    purple: "from-purple-50 to-indigo-50 border-purple-200",
    slate: "from-slate-50 to-slate-100 border-slate-200",
    red: "from-red-50 to-pink-50 border-red-200"
  };

  return (
    <>
      <PageSEO
        title="Support — EngageSwap Help Center"
        description="Get help with account, campaigns, earning, and payments."
        canonicalPath="/support"
      />


      <div className="max-w-5xl mx-auto space-y-8">
        <BackButton />

        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Help & Support</h1>
          <p className="text-xl text-slate-600">
            Get help with using EngageSwap effectively
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/faq')}>
            <div className="text-center">
              <div className="text-4xl mb-3">❓</div>
              <h3 className="text-xl font-bold mb-2">FAQ</h3>
              <p className="text-teal-50 text-sm">Browse frequently asked questions</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/contact')}>
            <div className="text-center">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="text-xl font-bold mb-2">Contact Us</h3>
              <p className="text-blue-50 text-sm">Send us a message directly</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/guide')}>
            <div className="text-center">
              <div className="text-4xl mb-3">📖</div>
              <h3 className="text-xl font-bold mb-2">User Guide</h3>
              <p className="text-purple-50 text-sm">Complete platform documentation</p>
            </div>
          </Card>
        </div>

        {/* Support Topics */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Browse by Topic</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {supportTopics.map((topic, index) => (
              <Card key={index} className={`bg-gradient-to-br ${colorClasses[topic.color]} hover:shadow-lg transition-shadow`}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{topic.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{topic.title}</h3>
                    <p className="text-sm text-slate-700">{topic.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Getting Started with EngageSwap</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Create Your Account</h3>
                <p className="text-sm text-slate-700">Sign up with your email and create a secure password. Verify your email to activate your account.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Start Earning Coins</h3>
                <p className="text-sm text-slate-700">Browse available campaigns in the 'Earn' section. Visit websites, watch content, and complete quizzes to earn your first coins.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Promote Your Content</h3>
                <p className="text-sm text-slate-700">Once you have coins, create your own campaign in the 'Promote' section to drive engaged traffic to your website.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Track Your Progress</h3>
                <p className="text-sm text-slate-700">Monitor your earnings, campaign performance, and overall activity through the Analytics dashboard.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Common Issues */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Common Issues & Solutions</h2>
          <div className="space-y-3">
            <details className="border border-slate-200 rounded-lg p-4">
              <summary className="font-semibold text-slate-900 cursor-pointer">Coins not credited after completing campaign</summary>
              <p className="text-sm text-slate-700 mt-2">Ensure you watched the full duration and completed the quiz. If coins are still missing after 5 minutes, contact support with your visit details.</p>
            </details>

            <details className="border border-slate-200 rounded-lg p-4">
              <summary className="font-semibold text-slate-900 cursor-pointer">Campaign not getting enough visits</summary>
              <p className="text-sm text-slate-700 mt-2">Campaigns are served in fair rotation. Ensure your quiz questions are clear and answerable. Check that your URL is accessible and content is engaging.</p>
            </details>

            <details className="border border-slate-200 rounded-lg p-4">
              <summary className="font-semibold text-slate-900 cursor-pointer">Unable to complete payment</summary>
              <p className="text-sm text-slate-700 mt-2">Check your payment method details, ensure sufficient balance, and try a different browser. Contact your bank if issues persist. Reach out to support@engageswap.in for payment issues.</p>
            </details>

            <details className="border border-slate-200 rounded-lg p-4">
              <summary className="font-semibold text-slate-900 cursor-pointer">Account suspended or restricted</summary>
              <p className="text-sm text-slate-700 mt-2">Review our Terms of Service to understand potential violations. Contact support to appeal or get clarification on the suspension reason.</p>
            </details>
          </div>
        </Card>

        {/* Contact Support */}
        <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Need More Help?</h2>
            <p className="text-slate-700 mb-6">
              Our support team is available Monday-Friday, 9 AM - 6 PM IST
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@engageswap.in" className="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                Email Support
              </a>
              <Button onClick={() => navigate('/contact')} className="bg-white text-teal-600 border-2 border-teal-600 hover:bg-teal-50">
                Contact Form
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
