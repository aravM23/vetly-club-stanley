import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

type Tab = 'signin' | 'signup'

export default function AuthPage() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const [tab, setTab] = useState<Tab>('signin')

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Loader2 className="size-5 animate-spin text-paper-mute" />
      </main>
    )
  }

  if (session) {
    const next = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={next} replace />
  }

  return (
    <main className="min-h-screen grid place-items-center px-6 py-16">
      <div className="w-full max-w-sm space-y-10">
        <div className="space-y-3">
          <p className="smallcaps text-paper-mute">Vetly</p>
          <h1 className="font-display text-4xl leading-tight text-paper">
            {tab === 'signin' ? 'Welcome back.' : 'Create your account.'}
          </h1>
          <p className="text-sm text-paper-mute">
            {tab === 'signin'
              ? 'Sign in to score and review your Creators.'
              : 'One account, top picks in your inbox every morning.'}
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-ink-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <SignInForm />
          </TabsContent>
          <TabsContent value="signup">
            <SignUpForm onDone={() => setTab('signin')} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function SignInForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        id="signin-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        required
      />
      <Field
        id="signin-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        required
      />
      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-lime text-lime-ink hover:bg-lime/90 smallcaps"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Sign in'}
      </Button>
    </form>
  )
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    setSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }
    setSentTo(email)
  }

  if (sentTo) {
    return (
      <div className="space-y-5 rounded-sm border border-ink-3 bg-ink-2 p-5">
        <p className="font-display text-2xl text-paper">Check your inbox.</p>
        <p className="text-sm text-paper-mute">
          We sent a verification link to <span className="text-paper">{sentTo}</span>. Click it to
          activate your account, then come back here to sign in.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          className="w-full smallcaps"
        >
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        id="signup-email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        required
      />
      <Field
        id="signup-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        required
        hint="At least 8 characters."
      />
      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-lime text-lime-ink hover:bg-lime/90 smallcaps"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Create account'}
      </Button>
    </form>
  )
}

type FieldProps = {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  required?: boolean
  hint?: string
}

function Field({ id, label, type, value, onChange, autoComplete, required, hint }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="smallcaps text-paper-mute">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="bg-ink-2 border-ink-3 text-paper placeholder:text-paper-mute focus-visible:ring-lime"
      />
      {hint && <p className="text-xs text-paper-mute">{hint}</p>}
    </div>
  )
}
