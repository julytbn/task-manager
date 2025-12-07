import Link from 'next/link'

export default function LoginHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="flex-none">
            <img src="/kekeli-logo.svg" alt="Kekeli Group" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">Kekeli Group</div>
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
