import MainLayout from '@/components/layouts/MainLayout'
import fs from 'fs'
import path from 'path'

type Props = { params: { id: string } }

export default async function TachePage({ params }: Props) {
  const taskId = params.id

  // Try to read files metadata if present
  let files: Array<{ name: string, originalName: string, url: string, mime?: string, size?: number }> = []
  try {
    const base = path.join(process.cwd(), 'public', 'uploads', 'tasks', taskId)
    const metaPath = path.join(base, '_files.json')
    if (fs.existsSync(metaPath)) {
      const raw = await fs.promises.readFile(metaPath, 'utf-8')
      files = JSON.parse(raw)
    }
  } catch (e) {
    console.error('Cannot read task files metadata', e)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gold-gradient-text">Détail tâche</h1>
          <p className="text-[var(--color-anthracite)] mt-2">Tâche — {taskId}</p>
        </div>

        <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-6">
          <div className="mb-4">Informations et actions pour la tâche {taskId}</div>

          {files.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-2">Fichiers joints</h3>
              <ul className="space-y-2">
                {files.map(f => (
                  <li key={f.name} className="flex items-center gap-3">
                    {f.mime && f.mime.startsWith('image/') ? (
                      <img src={f.url} alt={f.originalName} className="w-20 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-14 flex items-center justify-center bg-white border rounded text-sm text-gray-600">Fichier</div>
                    )}
                    <div>
                      <a className="text-indigo-600 underline" href={f.url} target="_blank" rel="noreferrer">{f.originalName || f.name}</a>
                      <div className="text-xs text-gray-500">{f.mime || '—'} • {f.size ? `${f.size} bytes` : ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Aucun fichier joint</div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
