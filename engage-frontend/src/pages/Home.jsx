export default function Home() {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Welcome to EngageSwap</h2>
      <p className="mt-2 text-slate-600">
        Trade real engagement with the community. Start by choosing an action:
      </p>
      <div className="mt-6 flex gap-3">
        <a href="/earn" className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700">
          Earn Coins
        </a>
        <a href="/promote" className="rounded-lg border px-4 py-2 font-medium hover:bg-slate-50">
          Create Campaign
        </a>
      </div>
    </div>
  );
}
