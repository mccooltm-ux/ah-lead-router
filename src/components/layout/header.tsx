"use client";

import { useState } from "react";

interface HeaderProps {
  onSyncClick?: () => void;
  isSyncing?: boolean;
  syncProgress?: string;
  lastSyncedAt?: string | null;
}

export function Header({ onSyncClick, isSyncing = false, syncProgress, lastSyncedAt }: HeaderProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSyncClick = () => {
    setShowConfirm(true);
  };

  const confirmSync = () => {
    setShowConfirm(false);
    if (onSyncClick) onSyncClick();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                <span className="text-lg font-bold text-white">AH</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  AH Lead Router
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  CRM Lead Ingestion &amp; Routing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastSyncedAt && (
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Last sync: {new Date(lastSyncedAt).toLocaleString()}
                </span>
              )}
              <button
                onClick={handleSyncClick}
                disabled={isSyncing}
                className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSyncing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {syncProgress || "Syncing..."}
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync from CRM
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 dark:bg-slate-900 shadow-xl max-w-md mx-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Sync Leads from CRM?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              This will fetch all leads from the <strong>Analyst Hub CRM</strong> leads tab and import them into the lead router.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
              You must be logged into crm.analysthub.com in this browser for the sync to work.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="inline-flex items-center justify-center rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSync}
                className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Start Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
