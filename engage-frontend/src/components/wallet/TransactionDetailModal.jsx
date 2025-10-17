import { useState } from 'react';

export default function TransactionDetailModal({ transaction, onClose }) {
  const [showRawMetadata, setShowRawMetadata] = useState(false);

  const formatAmount = (amount, sign) => {
    const num = parseFloat(amount || 0);
    const formatted = num.toFixed(3);
    if (sign === 'PLUS') {
      return `+${formatted}`;
    } else if (sign === 'MINUS') {
      return `-${formatted}`;
    }
    return formatted;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'REVERSED':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      EARNED: 'Earned',
      SPENT: 'Spent',
      BONUS: 'Bonus',
      REFUND: 'Refund',
      ADMIN_CREDIT: 'Admin Credit',
      ADMIN_DEBIT: 'Admin Debit',
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount & Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Amount</p>
              <p className={`text-3xl font-bold font-mono ${transaction.sign === 'PLUS' ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(transaction.amount, transaction.sign)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(transaction.status)}`}>
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Type</p>
              <p className="font-medium">{getTypeLabel(transaction.type)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Source</p>
              <p className="font-medium">{transaction.source}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500 mb-1">Date & Time</p>
              <p className="font-medium">{formatDate(transaction.created_at)}</p>
            </div>
            {transaction.balance_after && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500 mb-1">Balance After Transaction</p>
                <p className="font-mono font-bold text-lg text-blue-600">{parseFloat(transaction.balance_after).toFixed(3)}</p>
              </div>
            )}
          </div>

          {/* Campaign Info */}
          {transaction.campaign_id && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Campaign</p>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="font-medium">{transaction.campaign_title || 'Campaign'}</p>
                {transaction.campaign_public_id && (
                  <p className="text-sm text-gray-500 mt-1">ID: {transaction.campaign_public_id}</p>
                )}
              </div>
            </div>
          )}

          {/* Quiz Breakdown (if applicable) */}
          {transaction.metadata?.correct_count !== undefined && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Quiz Results</p>
              <div className="bg-blue-50 rounded-md p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Correct Answers:</span>
                  <span className="font-mono font-bold">
                    {transaction.metadata.correct_count} / {transaction.metadata.total_count || 5}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Multiplier:</span>
                  <span className="font-mono font-bold">{transaction.metadata.multiplier}x</span>
                </div>
                {transaction.metadata.full_reward && (
                  <div className="flex justify-between">
                    <span className="text-sm">Base Reward:</span>
                    <span className="font-mono font-bold">{parseFloat(transaction.metadata.full_reward).toFixed(3)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Final Reward:</span>
                  <span className="font-mono font-bold text-green-600">
                    {parseFloat(transaction.metadata.actual_reward || transaction.amount).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Consolation Info */}
          {transaction.source === 'consolation' && transaction.metadata?.reason && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Consolation Details</p>
              <div className="bg-yellow-50 rounded-md p-4">
                <p className="text-sm">
                  <span className="font-medium">Reason:</span> {transaction.metadata.reason}
                </p>
                {transaction.metadata.visit_token && (
                  <p className="text-xs text-gray-600 mt-2 font-mono break-all">
                    Visit Token: {transaction.metadata.visit_token}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Admin Remarks */}
          {transaction.metadata?.admin_username && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Admin Action</p>
              <div className="bg-purple-50 rounded-md p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Admin:</span>
                  <span className="font-medium">{transaction.metadata.admin_username}</span>
                </div>
                {transaction.metadata.reason && (
                  <div>
                    <span className="text-sm">Reason:</span>
                    <p className="mt-1 text-sm bg-white p-2 rounded border">{transaction.metadata.reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reference ID */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">Reference ID</p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs font-mono break-all">
                {transaction.reference_id}
              </code>
              <button
                onClick={() => copyToClipboard(transaction.reference_id)}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Raw Metadata (Collapsible) */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowRawMetadata(!showRawMetadata)}
                className="flex items-center justify-between w-full text-sm text-gray-500 hover:text-gray-700"
              >
                <span>Raw Metadata</span>
                <span>{showRawMetadata ? '▼' : '▶'}</span>
              </button>
              {showRawMetadata && (
                <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
