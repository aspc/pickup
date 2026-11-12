'use client'

import { postJson } from '@/utils/api'
import { useEffect, useId, useState } from 'react'

type EmailPreview = {
  would_send: number
  preview?: Array<{ to: string | string[]; subject: string }>
}

type EmailSendResult = {
  sent: number
  failed: number
  total: number
}

type EmailComposerModalProps = {
  title: string
  /** Who receives the email, e.g. "matched riders from 2026-10-22, all airports" */
  audience: string
  /** Placeholders the edge function fills in per recipient */
  placeholders: string[]
  endpoint: string
  /** Recipient filters merged into every request */
  filters: Record<string, unknown>
  /** Returns an error message when the filters are incomplete */
  validate?: () => string | null
  onClose: () => void
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error'

const pluralize = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`

export default function EmailComposerModal({
  title,
  audience,
  placeholders,
  endpoint,
  filters,
  validate,
  onClose,
}: EmailComposerModalProps) {
  const titleId = useId()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [pending, setPending] = useState<'preview' | 'send' | null>(null)
  const [preview, setPreview] = useState<EmailPreview | null>(null)
  const [result, setResult] = useState<EmailSendResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pending, onClose])

  const request = async <T,>(dryRun: boolean) =>
    postJson<T & { success?: boolean; message?: string }>(endpoint, {
      ...filters,
      dry_run: dryRun,
      custom_subject: subject,
      custom_body: body,
    })

  const run = async (kind: 'preview' | 'send') => {
    const validationError = validate?.() ?? null
    if (validationError) {
      setError(validationError)
      return
    }
    if (
      kind === 'send' &&
      !window.confirm(
        `Send this email to all ${audience}? This can't be undone.`,
      )
    ) {
      return
    }

    setPending(kind)
    setError(null)
    setPreview(null)
    setResult(null)
    try {
      if (kind === 'preview') {
        setPreview(await request<EmailPreview>(true))
      } else {
        setResult(await request<EmailSendResult>(false))
      }
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setPending(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 animate-overlay-in bg-navy-900/40"
        onClick={pending ? undefined : onClose}
      />

      <div className="relative flex max-h-full w-full max-w-3xl animate-dialog-in flex-col overflow-y-auto rounded-lg border border-line bg-card p-6 shadow-overlay">
        <div className="mb-5 flex items-start justify-between gap-4 border-b pb-3">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-navy">
              {title}
            </h2>
            <p className="mt-1 text-sm text-stone">To: {audience}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending !== null}
            aria-label="Close"
            className="rounded-full p-2 text-stone transition-colors hover:bg-sunken hover:text-ink disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <label
          htmlFor={`${titleId}-subject`}
          className="mb-1 block text-sm font-medium text-ink"
        >
          Subject
        </label>
        <input
          id={`${titleId}-subject`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mb-5 w-full rounded-md border border-line-strong px-3 py-2.5 hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-sage/30"
          placeholder="Email subject..."
          autoFocus
        />

        <label
          htmlFor={`${titleId}-body`}
          className="mb-1 block text-sm font-medium text-ink"
        >
          Body
        </label>
        <textarea
          id={`${titleId}-body`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="h-40 w-full rounded-md border border-line-strong p-3 hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-sage/30"
          placeholder="Write your email here..."
        />
        <p className="mt-2 text-xs text-stone">
          Leave a field empty to use the standard subject or email. Plain text
          only. Placeholders, filled in for each recipient:{' '}
          {placeholders.map((placeholder, index) => (
            <span key={placeholder}>
              {index > 0 && ', '}
              <code className="rounded bg-sunken px-1">{placeholder}</code>
            </span>
          ))}
        </p>

        <div className="mt-6 border-t pt-5">
          <h3 className="mb-3 text-lg font-semibold text-ink">Preview</h3>
          <div className="whitespace-pre-wrap rounded-md border border-line bg-paper p-4">
            <div className="mb-2 font-medium text-ink">
              {subject || '(Standard subject)'}
            </div>
            <div className="leading-relaxed text-ink">
              {body || '(Standard email)'}
            </div>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-danger/30 bg-danger-tint p-4 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}

        {preview && (
          <div className="mt-4 rounded-lg border border-navy-100 bg-navy-50 p-4">
            <p className="text-sm font-medium text-navy">
              Preview: would send {pluralize(preview.would_send, 'email')}
            </p>
            {preview.preview && preview.preview.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-navy">
                {preview.preview.map((email, index) => (
                  <li key={index}>
                    {[email.to].flat().join(', ')}: {email.subject}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {result && (
          <p
            className={`mt-4 rounded-lg border p-4 text-sm font-medium ${
              result.failed > 0
                ? 'border-danger/30 bg-danger-tint text-danger'
                : 'border-sage/30 bg-sage-tint text-sage-strong'
            }`}
          >
            Sent {result.sent} of {pluralize(result.total, 'email')}
            {result.failed > 0 && ` (${result.failed} failed)`}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={pending !== null}
            className="rounded-md border border-line-strong bg-card px-4 py-2 font-medium text-ink transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => run('preview')}
            disabled={pending !== null}
            className="rounded-md border border-line-strong bg-card px-4 py-2 font-medium text-navy transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending === 'preview' ? 'Checking...' : 'Preview Email'}
          </button>
          <button
            type="button"
            onClick={() => run('send')}
            disabled={pending !== null}
            className="rounded-md bg-navy px-4 py-2 font-medium text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending === 'send' ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  )
}
