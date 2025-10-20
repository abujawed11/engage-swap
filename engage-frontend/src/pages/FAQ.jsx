import React, { useState } from 'react';
import Card from '../components/ui/Card';
import BackButton from '../components/ui/BackButton';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: "General",
      questions: [
        {
          q: "What is EngageSwap?",
          a: "EngageSwap is a platform that connects content creators with engaged audiences. Promoters can drive traffic to their websites by creating campaigns, while earners can visit those campaigns and earn coins for genuine engagement."
        },
        {
          q: "How does EngageSwap work?",
          a: "Promoters create campaigns with their URL, watch duration, and quiz questions. Earners browse available campaigns, visit the websites, watch content for the required time, and complete a quiz to prove engagement. Based on quiz performance, earners receive coins that can be used to promote their own content."
        },
        {
          q: "Is EngageSwap free to use?",
          a: "Yes! Creating an account and earning coins by participating in campaigns is completely free. You only spend coins when you want to promote your own content through campaigns."
        }
      ]
    },
    {
      category: "For Earners",
      questions: [
        {
          q: "How do I earn coins?",
          a: "Browse the 'Earn' page, select a campaign, watch the content for the required duration (usually 30-120 seconds), and answer 5 quiz questions about the content. Your coin reward is based on your quiz score—higher scores earn more coins!"
        },
        {
          q: "What happens if I fail the quiz?",
          a: "If you score below the passing threshold, you may receive reduced coins or a consolation reward. The exact reward depends on campaign settings and your score. You cannot retry the same campaign immediately."
        },
        {
          q: "Can I visit the same campaign multiple times?",
          a: "No, you can only complete each campaign once. This ensures fair distribution and prevents gaming the system."
        },
        {
          q: "How long does it take to receive coins?",
          a: "Coins are credited to your account instantly after successfully completing the quiz."
        }
      ]
    },
    {
      category: "For Promoters",
      questions: [
        {
          q: "How do I create a campaign?",
          a: "Go to the 'Promote' page, enter your website URL, title, description, select watch duration, set your budget (number of visits), and create 5 quiz questions about your content. Once funded with coins, your campaign goes live!"
        },
        {
          q: "How much do campaigns cost?",
          a: "Campaign costs depend on watch duration. Longer watch times cost more coins per visit. You can see the cost breakdown before creating your campaign."
        },
        {
          q: "Can I pause or delete my campaign?",
          a: "Yes! You can pause your campaign at any time, and unused coins remain in the campaign budget. If you delete a campaign, all unused coins are refunded to your account."
        },
        {
          q: "How do I track campaign performance?",
          a: "Visit the 'Analytics' section to see detailed metrics including visits served, completion rates, quiz score averages, and more. You can also view individual campaign analytics."
        }
      ]
    },
    {
      category: "Coins & Payments",
      questions: [
        {
          q: "What are coins and how do they work?",
          a: "Coins are EngageSwap's virtual currency used for funding campaigns. You earn coins by participating in campaigns or purchase coin packs. Coins have no monetary value outside the platform."
        },
        {
          q: "Can I withdraw coins for real money?",
          a: "Currently, coins cannot be withdrawn or converted to cash. They can only be used within the EngageSwap platform to promote your content."
        },
        {
          q: "How do I purchase coins?",
          a: "Visit the 'Wallet' or 'Market' section and select a coin pack that suits your needs. Complete the purchase using our secure payment gateway (Razorpay)."
        },
        {
          q: "Are coin purchases refundable?",
          a: "Coin pack purchases are generally non-refundable once coins are credited to your account. However, we consider refund requests for payment errors or duplicate charges. See our Refund Policy for details."
        }
      ]
    },
    {
      category: "Rules & Safety",
      questions: [
        {
          q: "What content is prohibited on EngageSwap?",
          a: "We prohibit illegal content, adult/NSFW material, scams, phishing sites, malware, hate speech, violence, and anything that violates our Terms of Service. Violating campaigns will be removed, and accounts may be suspended."
        },
        {
          q: "Can I use bots or automation tools?",
          a: "Absolutely not. Using bots, scripts, or automation to earn coins or manipulate campaigns is strictly forbidden and will result in permanent account termination."
        },
        {
          q: "What if I encounter a problem or suspicious content?",
          a: "Please report any issues, bugs, or suspicious campaigns to our support team immediately via the Contact page or support@engageswap.in."
        }
      ]
    },
    {
      category: "Account & Support",
      questions: [
        {
          q: "I forgot my password. How do I reset it?",
          a: "Click 'Forgot Password' on the login page, enter your email address, and follow the instructions sent to your email to reset your password."
        },
        {
          q: "How do I delete my account?",
          a: "Contact our support team at support@engageswap.in to request account deletion. Please note that any remaining coin balance will be forfeited, and the action is irreversible."
        },
        {
          q: "How can I contact support?",
          a: "You can reach us via our Contact page, email us at support@engageswap.in, or visit the Support section for help articles and FAQs."
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton />

      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-slate-600">
          Find answers to common questions about EngageSwap
        </p>
      </div>

      <div className="space-y-6">
        {faqs.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <h2 className="text-2xl font-bold text-teal-700 mb-4">{category.category}</h2>
            <div className="space-y-3">
              {category.questions.map((faq, questionIndex) => {
                const isOpen = openIndex === `${categoryIndex}-${questionIndex}`;
                return (
                  <div key={questionIndex} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                      className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-900">{faq.q}</span>
                      <span className="text-xl text-teal-600">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 bg-white text-slate-700 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Still Have Questions?</h2>
          <p className="text-slate-700 mb-6">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <a
            href="/contact"
            className="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </Card>
    </div>
  );
}
