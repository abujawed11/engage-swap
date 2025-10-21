// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import Button from '../components/ui/Button';

// export default function Home() {
//   const navigate = useNavigate();

//   return (
//     <div className="space-y-12">
//       {/* Hero Section */}
//       <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600 p-12 text-white shadow-2xl">
//         <div className="relative z-10">
//           <h1 className="text-5xl font-bold mb-4">Welcome to EngageSwap</h1>
//           <p className="text-xl text-teal-50 mb-8 max-w-2xl">
//             The revolutionary platform where engagement meets rewards. Promote your content or earn coins by engaging with others.
//           </p>
//           <div className="flex gap-4">
//             <Button
//               onClick={() => navigate('/earn')}
//               className="bg-white text-teal-600 hover:bg-teal-50 font-semibold px-8 py-3 text-lg"
//             >
//               🎯 Start Earning
//             </Button>
//             <Button
//               onClick={() => navigate('/promote')}
//               className="bg-teal-700 text-white hover:bg-teal-800 font-semibold px-8 py-3 text-lg border-2 border-white/30"
//             >
//               🚀 Promote Content
//             </Button>
//           </div>
//         </div>

//         {/* Decorative circles */}
//         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
//         <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-700/30 rounded-full blur-3xl"></div>
//       </div>

//       {/* How It Works Section */}
//       <div>
//         <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">How EngageSwap Works</h2>
//         <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
//           A simple two-sided marketplace connecting content creators with engaged audiences
//         </p>

//         <div className="grid md:grid-cols-2 gap-8">
//           {/* Earn Side */}
//           <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
//                 💰
//               </div>
//               <h3 className="text-2xl font-bold text-blue-900">Earn Coins</h3>
//             </div>

//             <div className="space-y-4">
//               <div className="flex items-start gap-3">
//                 <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
//                   1
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-blue-900 mb-1">Browse Campaigns</h4>
//                   <p className="text-sm text-blue-700">Discover available campaigns from the Earn page</p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
//                   2
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-blue-900 mb-1">Visit & Engage</h4>
//                   <p className="text-sm text-blue-700">Watch content for required time (30-120 seconds)</p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
//                   3
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-blue-900 mb-1">Complete Quiz</h4>
//                   <p className="text-sm text-blue-700">Answer 5 questions to prove genuine engagement</p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
//                   ✓
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-green-900 mb-1">Get Rewarded</h4>
//                   <p className="text-sm text-green-700">Earn coins instantly based on your quiz score!</p>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 pt-6 border-t-2 border-blue-200">
//               <Button
//                 onClick={() => navigate('/earn')}
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
//               >
//                 Start Earning Now →
//               </Button>
//             </div>
//           </div>

//           {/* Promote Side */}
//           <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-2xl">
//                 📢
//               </div>
//               <h3 className="text-2xl font-bold text-orange-900">Promote Content</h3>
//             </div>

//             <div className="space-y-4">
//               <div className="flex items-start gap-3">
//                 <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
//                   1
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-orange-900 mb-1">Create Campaign</h4>
//                   <p className="text-sm text-orange-700">Set your URL, budget, and watch duration</p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
//                   2
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-orange-900 mb-1">Add Quiz Questions</h4>
//                   <p className="text-sm text-orange-700">Create 5 questions to ensure quality engagement</p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
//                   3
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-orange-900 mb-1">Fund Campaign</h4>
//                   <p className="text-sm text-orange-700">Use your earned coins to pay for visits</p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
//                   ✓
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-green-900 mb-1">Get Real Traffic</h4>
//                   <p className="text-sm text-green-700">Receive engaged visitors who actually watch your content!</p>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 pt-6 border-t-2 border-orange-200">
//               <Button
//                 onClick={() => navigate('/promote')}
//                 className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
//               >
//                 Create Campaign →
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Visual Flow Diagram */}
//       <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
//         <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">The EngageSwap Cycle</h2>

//         <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
//           {/* Earner */}
//           <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-300 w-64">
//             <div className="text-4xl mb-2 text-center">👤</div>
//             <h4 className="font-bold text-blue-900 text-center mb-2">Earner</h4>
//             <p className="text-sm text-slate-600 text-center">Visits campaigns & earns coins</p>
//           </div>

//           {/* Arrow Right */}
//           <div className="text-4xl text-teal-500 rotate-90 md:rotate-0">→</div>

//           {/* Platform */}
//           <div className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl p-6 shadow-lg border-2 border-teal-600 w-64">
//             <div className="text-4xl mb-2 text-center">🔄</div>
//             <h4 className="font-bold text-white text-center mb-2">EngageSwap</h4>
//             <p className="text-sm text-teal-50 text-center">Matches earners with campaigns</p>
//           </div>

//           {/* Arrow Right */}
//           <div className="text-4xl text-teal-500 rotate-90 md:rotate-0">→</div>

//           {/* Promoter */}
//           <div className="bg-white rounded-xl p-6 shadow-md border-2 border-orange-300 w-64">
//             <div className="text-4xl mb-2 text-center">🚀</div>
//             <h4 className="font-bold text-orange-900 text-center mb-2">Promoter</h4>
//             <p className="text-sm text-slate-600 text-center">Gets engaged visitors</p>
//           </div>
//         </div>

//         <div className="text-center mt-6">
//           <div className="text-4xl text-teal-500 mb-2">↻</div>
//           <p className="text-slate-600 font-medium">Earners become promoters. Promoters become earners. Everyone wins!</p>
//         </div>
//       </div>

//       {/* Key Features */}
//       <div>
//         <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Why Choose EngageSwap?</h2>

//         <div className="grid md:grid-cols-3 gap-6">
//           <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
//             <div className="text-4xl mb-4">✅</div>
//             <h3 className="text-xl font-bold text-slate-900 mb-2">Quality Guaranteed</h3>
//             <p className="text-slate-600">
//               Quiz-based verification ensures visitors genuinely engage with your content
//             </p>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
//             <div className="text-4xl mb-4">⚡</div>
//             <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Rewards</h3>
//             <p className="text-slate-600">
//               Earn coins immediately after completing tasks. No waiting, no delays
//             </p>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
//             <div className="text-4xl mb-4">📊</div>
//             <h3 className="text-xl font-bold text-slate-900 mb-2">Detailed Analytics</h3>
//             <p className="text-slate-600">
//               Track your campaign performance with real-time analytics and insights
//             </p>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
//             <div className="text-4xl mb-4">🔒</div>
//             <h3 className="text-xl font-bold text-slate-900 mb-2">Fair & Transparent</h3>
//             <p className="text-slate-600">
//               Clear pricing, no hidden fees. You only pay for genuine engagement
//             </p>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
//             <div className="text-4xl mb-4">🎯</div>
//             <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Matching</h3>
//             <p className="text-slate-600">
//               Fair rotation system ensures everyone gets exposure and opportunities
//             </p>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
//             <div className="text-4xl mb-4">💎</div>
//             <h3 className="text-xl font-bold text-slate-900 mb-2">Zero Entry Cost</h3>
//             <p className="text-slate-600">
//               Start earning coins immediately. No investment required to begin
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Stats Section */}
//       <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
//         <h2 className="text-3xl font-bold text-center mb-8">Platform Statistics</h2>
//         <div className="grid md:grid-cols-4 gap-6">
//           <div className="text-center">
//             <div className="text-4xl font-bold mb-2">5,000+</div>
//             <div className="text-purple-100">Total Visits</div>
//           </div>
//           <div className="text-center">
//             <div className="text-4xl font-bold mb-2">500+</div>
//             <div className="text-purple-100">Campaigns Created</div>
//           </div>
//           <div className="text-center">
//             <div className="text-4xl font-bold mb-2">1,000+</div>
//             <div className="text-purple-100">Active Users</div>
//           </div>
//           <div className="text-center">
//             <div className="text-4xl font-bold mb-2">95%</div>
//             <div className="text-purple-100">Satisfaction Rate</div>
//           </div>
//         </div>
//       </div>

//       {/* CTA Section */}
//       <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-12 text-center text-white shadow-2xl">
//         <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
//         <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
//           Join thousands of users who are already earning and promoting on EngageSwap
//         </p>
//         <div className="flex gap-4 justify-center">
//           <Button
//             onClick={() => navigate('/earn')}
//             className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-10 py-4 text-lg"
//           >
//             Start Earning Coins
//           </Button>
//           <Button
//             onClick={() => navigate('/promote')}
//             className="bg-emerald-700 text-white hover:bg-emerald-800 font-semibold px-10 py-4 text-lg border-2 border-white/30"
//           >
//             Promote Your Content
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }




import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import PageSEO from "../components/PageSEO";

export default function Home() {
  const navigate = useNavigate();

  return (

    <>

      <PageSEO
        title="EngageSwap — Free Website Promotion & Traffic Exchange"
        description="Promote your website for free and get real visitors. EngageSwap helps you grow traffic through mutual engagement — no bots, no ads, just real users."
        keywords="free website promotion, traffic exchange, get website visitors, SEO traffic, website marketing"
        canonicalPath="/"         // self canonical for home
      />

      <div className="space-y-14 md:space-y-16">
        {/* <Seo /> */}


        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 px-6 py-14 md:px-12 md:py-16 text-white shadow-2xl">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-black/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Free Website Promotion & Traffic Exchange
            </div>

            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Get real visitors, <span className="text-emerald-200">not bots</span>.
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-teal-50 md:text-xl">
              Campaigners promote their websites for free. Earners visit sites to earn coins.
              Watch-timer + quiz verification ensures genuine engagement.
            </p>

            {/* Dual CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => navigate("/promote")}
                className="px-8 py-3 text-lg font-semibold bg-white text-teal-700 hover:bg-teal-50"
              >
                🚀 I’m a Campaigner — Promote Free
              </Button>
              <Button
                onClick={() => navigate("/earn")}
                className="px-8 py-3 text-lg font-semibold border-2 border-white/40 bg-teal-800 hover:bg-teal-900 text-white"
              >
                🎯 I’m an Earner — Start Earning
              </Button>
            </div>

            {/* Trust bullets */}
            <ul className="mt-6 flex flex-col gap-2 text-sm/relaxed text-emerald-50 md:flex-row md:items-center md:gap-6">
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" /> 100% Free to start
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" /> Quiz-verified traffic
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" /> No bots. Real people.
              </li>
            </ul>
          </div>
        </section>

        {/* Audience Hooks */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-3 inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600/10 text-2xl">📢</div>
              <h3 className="text-2xl font-bold text-teal-900">For Campaigners</h3>
            </div>
            <p className="text-slate-700">
              Turn coins into real, engaged visits. Set watch duration, add 5 quiz questions, and only reward genuine
              viewers. Perfect for bloggers, SaaS, YouTubers, and small businesses.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-white px-3 py-1 text-teal-700 border border-teal-200">Free promotion</span>
              <span className="rounded-full bg-white px-3 py-1 text-teal-700 border border-teal-200">Anti-bot checks</span>
              <span className="rounded-full bg-white px-3 py-1 text-teal-700 border border-teal-200">Analytics</span>
            </div>
            <Button
              onClick={() => navigate("/promote")}
              className="mt-6 w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Create Your First Campaign →
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-3 inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/5 text-2xl">💰</div>
              <h3 className="text-2xl font-bold text-slate-900">For Earners</h3>
            </div>
            <p className="text-slate-700">
              Browse campaigns, watch for the required time, answer 5 quick questions, and earn coins instantly. Use coins
              to run your own campaigns or cash out (if enabled).
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-700 border">Instant rewards</span>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-700 border">Fair rotation</span>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-700 border">No fees</span>
            </div>
            <Button
              onClick={() => navigate("/earn")}
              className="mt-6 w-full bg-slate-900 hover:bg-black text-white font-semibold"
            >
              Start Earning Coins →
            </Button>
          </div>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-center text-3xl font-bold text-slate-900">How EngageSwap Works</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
            A two-sided marketplace matching Campaigners with Earners — backed by watch-timers and a 5-question quiz to
            verify real engagement.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600/10 text-2xl">🔗</div>
              <h3 className="text-lg font-semibold text-slate-900">Create or Pick a Campaign</h3>
              <p className="mt-1 text-slate-600">Campaigners set URL, duration & quiz. Earners choose a campaign to visit.</p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/10 text-2xl">⏱️</div>
              <h3 className="text-lg font-semibold text-slate-900">Watch & Verify</h3>
              <p className="mt-1 text-slate-600">Stay for the required time (e.g., 30–120s) and pass the 5-question quiz.</p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600/10 text-2xl">💎</div>
              <h3 className="text-lg font-semibold text-slate-900">Earn or Receive Traffic</h3>
              <p className="mt-1 text-slate-600">Earners get coins instantly. Campaigners receive verified visitors.</p>
            </div>
          </div>

          {/* Flow line */}
          <div className="mt-8 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 p-6 text-center">
            <div className="text-3xl">↻</div>
            <p className="mt-1 font-medium text-slate-700">
              Earners become campaigners. Campaigners become earners. The ecosystem fuels itself.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-center text-3xl font-bold text-slate-900">Benefits for Everyone</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
            Transparent, fair, and built to reward real engagement on both sides.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Campaigners */}
            <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-teal-900">Campaigners</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-600">✅</span>
                  <div>
                    <p className="font-medium">Real Visitors, Not Bots</p>
                    <p className="text-sm text-slate-600">Timer + quiz filter out low-quality or fake hits.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-600">📊</span>
                  <div>
                    <p className="font-medium">Clear Analytics</p>
                    <p className="text-sm text-slate-600">Track impressions, completions, and quiz accuracy.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-600">🎯</span>
                  <div>
                    <p className="font-medium">Smart Rotation</p>
                    <p className="text-sm text-slate-600">Fair exposure across campaigns; no paywalls.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Earners */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-slate-900">Earners</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-slate-900">⚡</span>
                  <div>
                    <p className="font-medium">Instant Rewards</p>
                    <p className="text-sm text-slate-600">Coins are credited right after successful verification.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-slate-900">🧭</span>
                  <div>
                    <p className="font-medium">Simple Workflow</p>
                    <p className="text-sm text-slate-600">Pick a campaign, watch, answer 5 quick questions. Done.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-slate-900">💬</span>
                  <div>
                    <p className="font-medium">No Fees</p>
                    <p className="text-sm text-slate-600">Start earning immediately—no investment required.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* (Optional) Compact Stats */}
        <section className="rounded-2xl bg-gradient-to-r from-slate-900 to-black p-8 text-white">
          <h2 className="text-center text-2xl font-bold">Community Snapshot</h2>
          <div className="mt-6 grid gap-6 text-center sm:grid-cols-3">
            <div>
              <div className="text-3xl font-extrabold">5,000+</div>
              <div className="text-white/70">Visits Served</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold">500+</div>
              <div className="text-white/70">Campaigns</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold">1,000+</div>
              <div className="text-white/70">Active Users</div>
            </div>
          </div>
        </section>

        {/* Pre-footer CTA */}
        <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to grow—free?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-emerald-50 md:text-lg">
            Join EngageSwap today. Promote your site without spending a rupee, or start earning coins by visiting others’
            sites.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => navigate("/promote")}
              className="px-8 py-3 text-lg font-semibold bg-white text-emerald-700 hover:bg-emerald-50"
            >
              Promote My Website
            </Button>
            <Button
              onClick={() => navigate("/earn")}
              className="px-8 py-3 text-lg font-semibold border-2 border-white/30 bg-emerald-800 hover:bg-emerald-900 text-white"
            >
              Start Earning Coins
            </Button>
          </div>
        </section>

      </div>
    </>
  );
}
