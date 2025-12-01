"use client"
import Link from "next/link"
import React from "react"

type Props = {
  children: React.ReactNode
  showHeader?: boolean
}

export default function UiLayout({ children, showHeader = true }: Props) {
  return (
    <div className="min-h-screen bg-background text-text">
      {showHeader && (
        <header className="bg-surface border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-primary rounded-sm" />
              <h1 className="text-lg font-semibold text-text">Kekeli Group</h1>
            </div>
            <nav className="flex items-center gap-4 text-sm text-muted">
              <Link href="/dashboard" className="hover:text-primaryLight">Dashboard</Link>
              <Link href="/clients" className="hover:text-primaryLight">Clients</Link>
              <Link href="/projets" className="hover:text-primaryLight">Projets</Link>
              <Link href="/kanban" className="hover:text-primaryLight">Kanban</Link>
              <Link href="/factures" className="hover:text-primaryLight">Factures</Link>
              <Link href="/paiements" className="hover:text-primaryLight">Paiements</Link>
              <Link href="/utilisateurs" className="hover:text-primaryLight">Utilisateurs</Link>
              <Link href="/parametres" className="hover:text-primaryLight">Paramètres</Link>
            </nav>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
