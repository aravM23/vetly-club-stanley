import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="flex items-end justify-between gap-4 border-b border-ink-3 pb-6">
          <div className="space-y-2">
            <p className="smallcaps text-paper-mute">Vetly</p>
            <h1 className="font-display text-4xl text-paper">Today's picks.</h1>
            <p className="text-sm text-paper-mute">
              Signed in as <span className="text-paper">{user?.email}</span>
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={signOut}
            className="smallcaps"
          >
            Sign out
          </Button>
        </header>

        <section className="space-y-4">
          <p className="text-paper-mute">
            Dashboard placeholder. Step 6 fills in the Creator table, filters, and drawer.
          </p>
          <div className="flex items-center gap-3">
            <span className="score-badge">92</span>
            <span className="font-mono text-sm text-paper">@example.creator</span>
            <span className="text-xs text-paper-mute">instagram, 248k followers</span>
          </div>
        </section>
      </div>
    </main>
  )
}
