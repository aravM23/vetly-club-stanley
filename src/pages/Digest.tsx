import { useEffect, useState } from 'react'
import { Loader2, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

type PreviewResponse = {
  html: string
  count: number
  picked: Array<{ id: string; handle: string; score: number }>
}

type SendResponse = {
  message_id?: string
  sent_to?: string
  picked?: number
  marked?: number
  sent?: false
  reason?: string
  mark_error?: string
}

export default function DigestPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [html, setHtml] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    void loadPreview()
  }, [])

  async function loadPreview() {
    setLoading(true)
    try {
      const data = await callDigest({ preview: true })
      const body = data as PreviewResponse
      setHtml(body.html)
      setCount(body.count)
    } catch (e) {
      toast.error(`Preview failed: ${e instanceof Error ? e.message : String(e)}`)
      setHtml(null)
      setCount(0)
    } finally {
      setLoading(false)
    }
  }

  async function sendTest() {
    setSending(true)
    try {
      // mark: false so testing the format doesn't consume Creators that
      // should still go in tomorrow's real digest.
      const data = (await callDigest({ mark: false })) as SendResponse
      if (data.sent === false) {
        toast(data.reason ?? 'Nothing to send.')
        return
      }
      toast.success(
        `Sent to ${data.sent_to ?? 'recipient'} · ${data.picked ?? 0} Creators · ${data.message_id ?? ''}`
      )
      if (data.mark_error) {
        toast.warning(`Sent but mark failed: ${data.mark_error}`)
      }
    } catch (e) {
      toast.error(`Send failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="px-8 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-end justify-between gap-4 border-b border-ink-3 pb-6">
          <div className="space-y-2">
            <p className="smallcaps text-paper-mute">Digest</p>
            <h1 className="font-display text-4xl text-paper">Tomorrow's email.</h1>
            <p className="font-mono text-xs text-paper-mute">
              {count} Creator{count === 1 ? '' : 's'} ready
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={loadPreview}
              disabled={loading || sending}
              className="smallcaps"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="mr-2 size-4" />
                  Refresh
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={sendTest}
              disabled={sending || loading || count === 0}
              className="smallcaps bg-lime text-lime-ink hover:bg-lime/90"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Mail className="mr-2 size-4" />
                  Send test now
                </>
              )}
            </Button>
          </div>
        </header>

        {loading && (
          <div className="grid min-h-[60vh] place-items-center">
            <Loader2 className="size-5 animate-spin text-paper-mute" />
          </div>
        )}

        {!loading && count === 0 && (
          <div className="rounded-sm border border-ink-3 bg-ink-2 p-12 text-center">
            <p className="font-display text-2xl text-paper">No Creators ready for digest.</p>
            <p className="mt-2 text-sm text-paper-mute">
              Score some Creators on the dashboard, or import more from /import.
            </p>
          </div>
        )}

        {!loading && html && count > 0 && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="smallcaps text-paper-mute">Preview</p>
              <p className="font-mono text-xs text-paper-mute">
                Test sends use mark=false, so these Creators stay in tomorrow's real digest.
              </p>
            </div>
            <iframe
              srcDoc={html}
              title="Email preview"
              className="h-[1200px] w-full rounded-sm border border-ink-3"
            />
          </section>
        )}
      </div>
    </main>
  )
}

async function callDigest(body: Record<string, unknown>): Promise<unknown> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not signed in')

  const res = await fetch(`${supabaseUrl}/functions/v1/send-digest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const parsed = (await res.json().catch(() => null)) as
    | Record<string, unknown>
    | null

  if (!res.ok || !parsed || ('error' in parsed && typeof parsed.error === 'string')) {
    const msg =
      parsed && typeof parsed.error === 'string' ? parsed.error : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return parsed
}
