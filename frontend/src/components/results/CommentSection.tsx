'use client'

import { MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/lib/database.types'
import { postJson, requestJson } from '@/utils/api'

type Comment = Database['public']['Tables']['Comments']['Row']
type UserSummary = {
  user_id: string
  firstname: string | null
}

type CommentWithUser = Comment & {
  user?: UserSummary | null
}

export default function CommentSection({ rideId }: { rideId: number }) {
  const [newComment, setNewComment] = useState('')
  const [commentList, setCommentList] = useState<CommentWithUser[]>([])
  const { user } = useAuth()
  const [userDetails, setUserDetails] = useState<UserSummary | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const shouldAutoScrollRef = useRef(false)

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return

    const container = scrollContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }

    shouldAutoScrollRef.current = false
  }, [commentList])

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const result = await requestJson<{
          success: boolean
          comments: CommentWithUser[]
          currentUser: UserSummary | null
        }>(`/api/comments?rideId=${rideId}`)

        setCommentList(result.comments || [])
        setUserDetails(result.currentUser)
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    }

    void fetchComments()
  }, [rideId, user?.id])

  const handleAddComment = async () => {
    const trimmed = newComment.trim()
    if (!trimmed || !user || !userDetails) return

    const optimisticId = -Date.now()
    const optimisticComment: CommentWithUser = {
      id: optimisticId,
      ride_id: rideId,
      match_id: null,
      user_id: user.id,
      comment: trimmed,
      created_at: new Date().toISOString(),
      user: userDetails,
    }

    shouldAutoScrollRef.current = true
    setCommentList((prev) => [...prev, optimisticComment])
    setNewComment('')

    try {
      const result = await postJson<{
        success: boolean
        comment: CommentWithUser
      }>('/api/comments', {
        rideId,
        comment: trimmed,
      })

      setCommentList((prev) =>
        prev.map((comment) =>
          comment.id === optimisticId ? result.comment : comment,
        ),
      )
    } catch (error) {
      console.error('Error adding comment:', error)
      setCommentList((prev) => prev.filter((c) => c.id !== optimisticId))
    }
  }

  return (
    <div className="flex max-h-72 flex-col overflow-hidden rounded-lg border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <MessageCircle aria-hidden className="h-4 w-4 text-stone" />
        <p className="text-sm font-medium text-navy">Group chat</p>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex flex-col gap-2 overflow-y-auto px-4 py-3 text-sm"
      >
        {commentList.length > 0 ? (
          commentList.map((comment) => {
            const mine = comment.user_id === user?.id
            return (
              <div
                key={comment.id}
                className={
                  mine
                    ? 'max-w-[85%] self-end rounded-lg rounded-br-sm bg-navy px-3 py-2 text-white'
                    : 'max-w-[85%] self-start rounded-lg rounded-bl-sm bg-sunken px-3 py-2 text-ink'
                }
              >
                {!mine && (
                  <span className="block text-xs font-semibold text-navy">
                    {comment.user?.firstname || 'Unknown User'}
                  </span>
                )}
                <span className="break-words">{comment.comment}</span>
              </div>
            )
          })
        ) : (
          <p className="py-2 text-sm text-stone">No messages yet.</p>
        )}
      </div>
      <form
        className="mt-auto flex gap-2 border-t border-line p-2"
        onSubmit={(event) => {
          event.preventDefault()
          void handleAddComment()
        }}
      >
        <Input
          aria-label="Message your group"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Type your message..."
          className="h-10 flex-1"
        />
        <Button
          type="submit"
          size="sm"
          className="h-10"
          disabled={!newComment.trim()}
        >
          Send
        </Button>
      </form>
    </div>
  )
}
