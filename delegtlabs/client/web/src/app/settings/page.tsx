export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Workspace preferences</h1>
      </div>
      <div className="rounded-xl border border-white/10 bg-[#111827] p-6 space-y-4 max-w-xl">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Display name
          </label>
          <input
            defaultValue="Alex Chen"
            className="w-full rounded-lg border border-white/10 bg-[#0B0F17] px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Notification email
          </label>
          <input
            defaultValue="alex@acme.io"
            className="w-full rounded-lg border border-white/10 bg-[#0B0F17] px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50"
          />
        </div>
        <button
          type="button"
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
