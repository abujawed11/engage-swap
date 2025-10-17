// src/components/market/FAQSection.jsx
import { useState } from 'react';
import Card from '../ui/Card';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How do coin packs work?',
      answer: 'Purchase a coin pack to add coins to your wallet. Use these coins to create campaigns and boost your engagement. The more coins you buy, the bigger the bonus percentage you receive!',
    },
    {
      question: 'What are bonus coins?',
      answer: 'Bonus coins are extra coins added to your purchase at no additional cost. For example, the Explorer pack gives you 250 base coins + 10% bonus = 275 total coins. Higher tier packs offer bigger bonuses!',
    },
    {
      question: 'Can I get a refund?',
      answer: 'Once coins are added to your wallet, refunds are generally not available. However, if you delete a campaign before it completes, unused coins will be refunded to your wallet automatically.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We will be accepting payments via Razorpay (UPI, Cards, Net Banking, Wallets) and Stripe (International Cards). Secure payment integration is currently being finalized.',
    },
    {
      question: 'Do coin prices change?',
      answer: 'Prices may be adjusted periodically based on market conditions. We recommend purchasing packs during promotional periods for the best value. You will always see the current price before checkout.',
    },
    {
      question: 'What is "Effective Price per Coin"?',
      answer: 'This shows the actual cost per coin including bonuses. For example, if you pay ₹199 for 575 total coins (500 base + 15% bonus), your effective price is ₹0.346 per coin - better value than smaller packs!',
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Card className="p-6 bg-white border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">
        Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-slate-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
            >
              <span className="font-semibold text-slate-900">{faq.question}</span>
              <span className="text-slate-600 text-xl">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-4 py-3 bg-white border-t border-slate-200">
                <p className="text-slate-700 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
