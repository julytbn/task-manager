export default function PaiementsLayout({
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
