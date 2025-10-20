import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600 p-12 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-4">Welcome to EngageSwap</h1>
          <p className="text-xl text-teal-50 mb-8 max-w-2xl">
            The revolutionary platform where engagement meets rewards. Promote your content or earn coins by engaging with others.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/earn')}
              className="bg-white text-teal-600 hover:bg-teal-50 font-semibold px-8 py-3 text-lg"
            >
              🎯 Start Earning
            </Button>
            <Button
              onClick={() => navigate('/promote')}
              className="bg-teal-700 text-white hover:bg-teal-800 font-semibold px-8 py-3 text-lg border-2 border-white/30"
            >
              🚀 Promote Content
            </Button>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-700/30 rounded-full blur-3xl"></div>
      </div>

      {/* How It Works Section */}
      <div>
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">How EngageSwap Works</h2>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
          A simple two-sided marketplace connecting content creators with engaged audiences
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Earn Side */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
                💰
              </div>
              <h3 className="text-2xl font-bold text-blue-900">Earn Coins</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Browse Campaigns</h4>
                  <p className="text-sm text-blue-700">Discover available campaigns from the Earn page</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Visit & Engage</h4>
                  <p className="text-sm text-blue-700">Watch content for required time (30-120 seconds)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Complete Quiz</h4>
                  <p className="text-sm text-blue-700">Answer 5 questions to prove genuine engagement</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Get Rewarded</h4>
                  <p className="text-sm text-green-700">Earn coins instantly based on your quiz score!</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-blue-200">
              <Button
                onClick={() => navigate('/earn')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Start Earning Now →
              </Button>
            </div>
          </div>

          {/* Promote Side */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-2xl">
                📢
              </div>
              <h3 className="text-2xl font-bold text-orange-900">Promote Content</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Create Campaign</h4>
                  <p className="text-sm text-orange-700">Set your URL, budget, and watch duration</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Add Quiz Questions</h4>
                  <p className="text-sm text-orange-700">Create 5 questions to ensure quality engagement</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Fund Campaign</h4>
                  <p className="text-sm text-orange-700">Use your earned coins to pay for visits</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Get Real Traffic</h4>
                  <p className="text-sm text-green-700">Receive engaged visitors who actually watch your content!</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-orange-200">
              <Button
                onClick={() => navigate('/promote')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
              >
                Create Campaign →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Flow Diagram */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">The EngageSwap Cycle</h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
          {/* Earner */}
          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-300 w-64">
            <div className="text-4xl mb-2 text-center">👤</div>
            <h4 className="font-bold text-blue-900 text-center mb-2">Earner</h4>
            <p className="text-sm text-slate-600 text-center">Visits campaigns & earns coins</p>
          </div>

          {/* Arrow Right */}
          <div className="text-4xl text-teal-500 rotate-90 md:rotate-0">→</div>

          {/* Platform */}
          <div className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl p-6 shadow-lg border-2 border-teal-600 w-64">
            <div className="text-4xl mb-2 text-center">🔄</div>
            <h4 className="font-bold text-white text-center mb-2">EngageSwap</h4>
            <p className="text-sm text-teal-50 text-center">Matches earners with campaigns</p>
          </div>

          {/* Arrow Right */}
          <div className="text-4xl text-teal-500 rotate-90 md:rotate-0">→</div>

          {/* Promoter */}
          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-orange-300 w-64">
            <div className="text-4xl mb-2 text-center">🚀</div>
            <h4 className="font-bold text-orange-900 text-center mb-2">Promoter</h4>
            <p className="text-sm text-slate-600 text-center">Gets engaged visitors</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <div className="text-4xl text-teal-500 mb-2">↻</div>
          <p className="text-slate-600 font-medium">Earners become promoters. Promoters become earners. Everyone wins!</p>
        </div>
      </div>

      {/* Key Features */}
      <div>
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Why Choose EngageSwap?</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Quality Guaranteed</h3>
            <p className="text-slate-600">
              Quiz-based verification ensures visitors genuinely engage with your content
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Rewards</h3>
            <p className="text-slate-600">
              Earn coins immediately after completing tasks. No waiting, no delays
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Detailed Analytics</h3>
            <p className="text-slate-600">
              Track your campaign performance with real-time analytics and insights
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Fair & Transparent</h3>
            <p className="text-slate-600">
              Clear pricing, no hidden fees. You only pay for genuine engagement
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Matching</h3>
            <p className="text-slate-600">
              Fair rotation system ensures everyone gets exposure and opportunities
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Zero Entry Cost</h3>
            <p className="text-slate-600">
              Start earning coins immediately. No investment required to begin
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-8">Platform Statistics</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">5,000+</div>
            <div className="text-purple-100">Total Visits</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-purple-100">Campaigns Created</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">1,000+</div>
            <div className="text-purple-100">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">95%</div>
            <div className="text-purple-100">Satisfaction Rate</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-12 text-center text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
          Join thousands of users who are already earning and promoting on EngageSwap
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/earn')}
            className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-10 py-4 text-lg"
          >
            Start Earning Coins
          </Button>
          <Button
            onClick={() => navigate('/promote')}
            className="bg-emerald-700 text-white hover:bg-emerald-800 font-semibold px-10 py-4 text-lg border-2 border-white/30"
          >
            Promote Your Content
          </Button>
        </div>
      </div>
    </div>
  );
}
