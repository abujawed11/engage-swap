import React from 'react';
import Card from '../components/ui/Card';
import BackButton from '../components/ui/BackButton';
import { useNavigate } from 'react-router-dom';
import PageSEO from '../components/PageSEO';

export default function Guide() {
  const navigate = useNavigate();

  return (
    <>
      <PageSEO
        title="User Guide — How EngageSwap Works"
        description="Step-by-step instructions for campaigners and earners: create campaigns, pass quizzes, and earn coins."
        canonicalPath="/guide"
      />
      <div className="max-w-4xl mx-auto space-y-8">
        <BackButton />

        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">EngageSwap User Guide</h1>
          <p className="text-xl text-slate-600">
            Complete guide to using EngageSwap effectively
          </p>
        </div>

        {/* Introduction */}
        <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Welcome to EngageSwap!</h2>
          <p className="text-slate-700 leading-relaxed">
            EngageSwap is a two-sided marketplace that connects content creators with engaged audiences. Whether
            you want to earn coins by visiting campaigns or promote your own content, this guide will help you
            get started and make the most of our platform.
          </p>
        </Card>

        {/* Account Setup */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Getting Started</h2>

          <h3 className="text-lg font-semibold text-teal-700 mb-3">Creating Your Account</h3>
          <ol className="list-decimal pl-6 text-slate-700 space-y-2 mb-6">
            <li>Click "Sign Up" in the top right corner</li>
            <li>Enter your username, email address, and create a secure password</li>
            <li>Verify your email by clicking the link sent to your inbox</li>
            <li>Log in and complete your profile</li>
          </ol>

          <h3 className="text-lg font-semibold text-teal-700 mb-3">Dashboard Overview</h3>
          <p className="text-slate-700 leading-relaxed mb-2">
            After logging in, you'll see your dashboard with:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-1">
            <li><strong>Available Balance:</strong> Your current coin balance</li>
            <li><strong>Quick Actions:</strong> Shortcuts to Earn and Promote</li>
            <li><strong>Sidebar Menu:</strong> Access to all platform features</li>
          </ul>
        </Card>

        {/* Earning Guide */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Earning Coins</h2>

          <h3 className="text-lg font-semibold text-orange-700 mb-3">How to Earn Coins</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Browse Available Campaigns</h4>
                <p className="text-sm text-slate-700">Go to the "Earn" page to see all active campaigns. Each campaign shows the reward amount and watch duration.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Start the Campaign</h4>
                <p className="text-sm text-slate-700">Click "Start Campaign" to begin. You'll be redirected to the promoted website in a new tab.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Watch & Engage</h4>
                <p className="text-sm text-slate-700">Watch the content for the full required duration (30-120 seconds). Pay attention as you'll be quizzed on it!</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Complete the Quiz</h4>
                <p className="text-sm text-slate-700">Answer 5 questions about the content. Your reward depends on your quiz score—higher scores earn more coins!</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Receive Coins</h4>
                <p className="text-sm text-slate-700">Coins are instantly credited to your account! Check your balance in the header or wallet page.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Earning More</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Pay close attention to the content—quiz questions are based on what you watch</li>
              <li>• Take your time to read and understand the content thoroughly</li>
              <li>• Higher quiz scores = more coins earned</li>
              <li>• Complete multiple campaigns daily to maximize earnings</li>
              <li>• Check back regularly for new campaigns</li>
            </ul>
          </div>
        </Card>

        {/* Promoting Guide */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Promoting Your Content</h2>

          <h3 className="text-lg font-semibold text-purple-700 mb-3">Creating a Campaign</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Go to Promote Page</h4>
                <p className="text-sm text-slate-700">Click "Promote" in the sidebar to access the campaign creation form.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Enter Campaign Details</h4>
                <p className="text-sm text-slate-700">Provide your website URL, campaign title, and description. Make sure your URL is accessible and working.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Set Watch Duration</h4>
                <p className="text-sm text-slate-700">Choose how long visitors should stay on your page (30-120 seconds). Longer duration costs more coins per visit.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Create Quiz Questions</h4>
                <p className="text-sm text-slate-700">Add 5 multiple-choice questions about your content. Make them fair and answerable to ensure quality engagement.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                5
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Set Budget</h4>
                <p className="text-sm text-slate-700">Decide how many visits you want. The total cost will be calculated based on watch duration and visits.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Launch Campaign</h4>
                <p className="text-sm text-slate-700">Review your campaign and click "Create Campaign." Coins will be deducted, and your campaign goes live!</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">🚀 Tips for Better Campaigns</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Use clear, descriptive titles that accurately represent your content</li>
              <li>• Create fair quiz questions that test genuine engagement</li>
              <li>• Ensure your website loads quickly and is mobile-friendly</li>
              <li>• Avoid prohibited content (illegal, adult, scams, etc.)</li>
              <li>• Monitor your analytics to optimize future campaigns</li>
            </ul>
          </div>
        </Card>

        {/* Managing Campaigns */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Managing Your Campaigns</h2>

          <h3 className="text-lg font-semibold text-slate-900 mb-3">Campaign Actions</h3>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">▸</span>
              <span><strong>Pause:</strong> Temporarily stop your campaign without losing unused coins</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">▸</span>
              <span><strong>Resume:</strong> Restart a paused campaign to continue receiving visits</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">▸</span>
              <span><strong>Delete:</strong> Permanently remove a campaign and get refunded for unused visits</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">▸</span>
              <span><strong>View Analytics:</strong> Check detailed metrics about your campaign performance</span>
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Understanding Campaign Status</h3>
          <ul className="space-y-2 text-slate-700">
            <li><strong className="text-green-700">Active:</strong> Campaign is running and receiving visits</li>
            <li><strong className="text-slate-600">Paused:</strong> Temporarily stopped by you</li>
            <li><strong className="text-blue-700">Finished:</strong> All visits completed successfully</li>
            <li><strong className="text-red-700">Deleted:</strong> Campaign removed, visible in analytics only</li>
          </ul>
        </Card>

        {/* Wallet & Coins */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Wallet & Coins</h2>

          <h3 className="text-lg font-semibold text-green-700 mb-3">Managing Your Balance</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Access your wallet to view your coin balance, transaction history, and purchase coin packs.
          </p>

          <h3 className="text-lg font-semibold text-slate-900 mb-2">Purchasing Coins</h3>
          <ol className="list-decimal pl-6 text-slate-700 space-y-2 mb-4">
            <li>Go to "Wallet" or "Market" section</li>
            <li>Select a coin pack that fits your needs</li>
            <li>Complete payment through our secure gateway (Razorpay)</li>
            <li>Coins are credited instantly after successful payment</li>
          </ol>

          <h3 className="text-lg font-semibold text-slate-900 mb-2">Transaction History</h3>
          <p className="text-slate-700 leading-relaxed">
            View all your earnings, spending, and purchases in your wallet's transaction history. Filter by date
            and transaction type to track your activity.
          </p>
        </Card>

        {/* Analytics */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Analytics & Tracking</h2>

          <h3 className="text-lg font-semibold text-purple-700 mb-3">Understanding Your Analytics</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            The Analytics page provides detailed insights into your activity:
          </p>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-slate-900">My Campaigns</h4>
              <p className="text-sm text-slate-700">View all your campaigns with metrics like visits served, completion rates, and average quiz scores.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">My Earnings</h4>
              <p className="text-sm text-slate-700">Track your earning history, total coins earned, and performance over time.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Campaign Details</h4>
              <p className="text-sm text-slate-700">Click any campaign to see in-depth analytics including daily trends, quiz performance, and visitor engagement.</p>
            </div>
          </div>
        </Card>

        {/* Rules & Best Practices */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Rules & Best Practices</h2>

          <h3 className="text-lg font-semibold text-red-700 mb-3">Important Rules</h3>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span>Do NOT use bots, automation, or multiple accounts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span>Do NOT promote illegal, adult, or fraudulent content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span>Do NOT create unfair or impossible quiz questions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span>Do NOT try to game the system or manipulate results</span>
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-green-700 mt-6 mb-3">Best Practices</h3>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Be honest and genuine in your engagement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Read Terms of Service and Privacy Policy</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Report suspicious content or violations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Contact support if you encounter issues</span>
            </li>
          </ul>
        </Card>

        {/* Support */}
        <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Need More Help?</h2>
            <p className="text-slate-700 mb-6">
              Check our FAQ, contact support, or browse additional resources
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate('/faq')}
                className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                View FAQ
              </button>
              <button
                onClick={() => navigate('/support')}
                className="bg-white text-teal-600 border-2 border-teal-600 px-6 py-2 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
              >
                Get Support
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
