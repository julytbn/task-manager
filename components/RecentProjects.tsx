import React from "react"
import Link from "next/link"

type Projet = {
  id: string
  titre: string
  dateCreation: string
}

type Props = { projects: Projet[] }

export default function RecentProjects({ projects }: Props) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="text-sm text-gray-500">Projets récents</div>
      <ul className="mt-3 space-y-2">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{p.titre}</div>
              <div className="text-xs text-gray-400">{new Date(p.dateCreation).toLocaleDateString()}</div>
            </div>
            <Link href={`/projets/${p.id}`} className="text-blue-700 text-sm">Voir</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
