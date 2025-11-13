import Link from 'next/link';
import ApiKeySettings from '@/app/components/settings/ApiKeySettings';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← ホームに戻る
          </Link>
        </div>

        <ApiKeySettings />
      </div>
    </div>
  );
}
