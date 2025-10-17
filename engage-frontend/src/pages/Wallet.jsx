import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import TransactionHistory from '../components/wallet/TransactionHistory';
import { API_BASE } from '../lib/api';

export default function Wallet() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('engage_swap_token');
      const response = await fetch(`${API_BASE}/wallet/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      setBalance(data.balance);
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount || 0);
    return num.toFixed(3);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-red-50">
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={fetchBalance}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Wallet</h1>

      {/* Balance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Available Balance */}
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex flex-col">
            <p className="text-sm font-medium opacity-90 mb-1">Available</p>
            <p className="text-3xl font-bold">{formatAmount(balance?.available)}</p>
            <p className="text-xs opacity-75 mt-1">coins</p>
          </div>
        </Card>

        {/* Locked Balance */}
        <Card className="p-6 bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <div className="flex flex-col">
            <p className="text-sm font-medium opacity-90 mb-1">Locked</p>
            <p className="text-3xl font-bold">{formatAmount(balance?.locked)}</p>
            <p className="text-xs opacity-75 mt-1">coins</p>
          </div>
        </Card>

        {/* Lifetime Earned */}
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex flex-col">
            <p className="text-sm font-medium opacity-90 mb-1">Lifetime Earned</p>
            <p className="text-3xl font-bold">{formatAmount(balance?.lifetime_earned)}</p>
            <p className="text-xs opacity-75 mt-1">total coins earned</p>
          </div>
        </Card>

        {/* Lifetime Spent */}
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex flex-col">
            <p className="text-sm font-medium opacity-90 mb-1">Lifetime Spent</p>
            <p className="text-3xl font-bold">{formatAmount(balance?.lifetime_spent)}</p>
            <p className="text-xs opacity-75 mt-1">total coins spent</p>
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        <TransactionHistory />
      </Card>
    </div>
  );
}
