import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatCoinsValue } from '../lib/coins';
import { useApp } from '../lib/appState';
import PageSEO from '../components/PageSEO';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, coins } = useApp();

  return (
    <>
      <PageSEO
        title="Dashboard | EngageSwap"
        description="Manage your campaigns, coins and activity."
        canonicalPath="/dashboard"
        robots="noindex,follow"
      />


      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}! 👋</h1>
          <p className="text-teal-50">Here's your EngageSwap dashboard overview</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="text-sm text-green-700 font-semibold mb-1">Available Balance</div>
            <div className="text-3xl font-bold text-green-900">
              {formatCoinsValue(user.coins || 0)}
            </div>
            <Button
              onClick={() => navigate('/wallet')}
              className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-sm"
            >
              View Wallet
            </Button>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <div className="text-sm text-purple-700 font-semibold mb-1">Analytics</div>
            <div className="text-3xl font-bold text-purple-900">📊</div>
            <Button
              onClick={() => navigate('/analytics')}
              className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              View Analytics
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Earn Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-sm">
                💰
              </div>
              <div>
                <h3 className="text-2xl font-bold">Earn Coins</h3>
                <p className="text-blue-100">Visit campaigns and get rewarded</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/earn')}
              className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            >
              Browse Campaigns →
            </Button>
          </Card>

          {/* Promote Card */}
          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-sm">
                🚀
              </div>
              <div>
                <h3 className="text-2xl font-bold">Promote Content</h3>
                <p className="text-orange-100">Drive traffic to your content</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/promote')}
              className="w-full bg-white text-orange-600 hover:bg-orange-50 font-semibold"
            >
              Create Campaign →
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
