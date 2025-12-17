export default function AgendaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 overflow-auto">
      {children}
    </div>
  )
}
