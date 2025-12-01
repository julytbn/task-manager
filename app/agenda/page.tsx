import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect old/shortcut `/agenda` to employee calendar
  redirect('/dashboard/employe/calendrier')
}
