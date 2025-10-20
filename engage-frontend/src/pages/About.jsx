import React from 'react';
import Card from '../components/ui/Card';
import BackButton from '../components/ui/BackButton';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton />

      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">About EngageSwap</h1>
        <p className="text-xl text-slate-600">
          Connecting content creators with engaged audiences through fair, transparent rewards
        </p>
      </div>

      {/* Mission Section */}
      <Card>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          EngageSwap is revolutionizing digital content promotion by creating a win-win ecosystem where
          content creators can drive quality traffic to their websites while users earn rewards for genuine engagement.
        </p>
        <p className="text-slate-700 leading-relaxed">
          We believe in fair compensation for attention and quality interactions. Unlike traditional advertising
          platforms that rely on intrusive ads, we've built a system where both parties benefit directly from
          meaningful engagement.
        </p>
      </Card>

      {/* How It Works */}
      <Card>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">How EngageSwap Works</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-teal-700 mb-2">For Earners</h3>
            <p className="text-slate-700 leading-relaxed">
              Browse available campaigns, visit websites, watch content for a specified duration, and complete
              a short quiz to prove genuine engagement. Earn coins instantly based on your quiz performance,
              with higher scores earning more rewards.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-orange-700 mb-2">For Promoters</h3>
            <p className="text-slate-700 leading-relaxed">
              Create campaigns by setting your URL, budget, watch duration, and custom quiz questions. Your
              content gets promoted to real users who are incentivized to engage meaningfully. Track your
              campaign performance with detailed analytics in real-time.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-700 mb-2">The Platform</h3>
            <p className="text-slate-700 leading-relaxed">
              EngageSwap uses a fair rotation algorithm to match campaigns with users, ensuring everyone gets
              equal opportunities. Our quiz-based verification system guarantees that promoters receive genuine,
              engaged visitors rather than passive clicks.
            </p>
          </div>
        </div>
      </Card>

      {/* Our Values */}
      <Card>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Core Values</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">🎯 Quality First</h3>
            <p className="text-slate-700">
              We prioritize meaningful engagement over quantity. Our quiz system ensures visitors actually
              consume and understand the content.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">⚖️ Fair & Transparent</h3>
            <p className="text-slate-700">
              Clear pricing, no hidden fees, and transparent analytics. Everyone knows exactly what they're
              getting and what they're paying for.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">🔒 Trust & Security</h3>
            <p className="text-slate-700">
              We protect user data, prevent fraud, and maintain a safe environment for both earners and promoters.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">🚀 Innovation</h3>
            <p className="text-slate-700">
              Constantly improving our platform with new features, better algorithms, and enhanced user experiences.
            </p>
          </div>
        </div>
      </Card>

      {/* Why Choose Us */}
      <Card>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Why Choose EngageSwap?</h2>
        <ul className="space-y-3 text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">✓</span>
            <span><strong>Zero Entry Barrier:</strong> Start earning immediately without any investment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">✓</span>
            <span><strong>Instant Payments:</strong> Coins are credited immediately after task completion</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">✓</span>
            <span><strong>Quality Traffic:</strong> Get visitors who genuinely engage with your content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">✓</span>
            <span><strong>Detailed Analytics:</strong> Track every aspect of your campaign performance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">✓</span>
            <span><strong>Fair Rotation:</strong> Smart matching ensures equal opportunities for all</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">✓</span>
            <span><strong>User-Friendly:</strong> Simple, intuitive interface for both beginners and experts</span>
          </li>
        </ul>
      </Card>

      {/* Contact CTA */}
      <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Have Questions?</h2>
          <p className="text-slate-700 mb-6">
            We're here to help! Reach out to our team for any queries or support.
          </p>
          <a
            href="/contact"
            className="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </Card>
    </div>
  );
}
