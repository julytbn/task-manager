import Link from 'next/link'

export default function LoginHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="flex-none">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="2" y="2" width="20" height="20" rx="4" fill="#2563EB" />
              <path d="M7 12h10M7 8h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">Kekeli WorkFlow</div>
            <div className="text-sm text-gray-500">TaskManager</div>
          </div>
        </div>

        <nav className="flex items-center space-x-4 text-sm">
          <Link href="#" className="text-gray-600 hover:text-gray-800">
            Aide
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-800">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
}
