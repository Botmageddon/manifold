import { PaperAirplaneIcon } from '@heroicons/react/solid'
import { Editor } from '@tiptap/react'
import clsx from 'clsx'
import { User } from 'common/user'
import { useEffect, useState } from 'react'
import { useUser } from 'web/hooks/use-user'
import { useWindowSize } from 'web/hooks/use-window-size'
import { MAX_COMMENT_LENGTH } from 'web/lib/firebase/comments'
import { Avatar } from './avatar'
import { TextEditor, useTextEditor } from './editor'
import { Row } from './layout/row'
import { LoadingIndicator } from './loading-indicator'

export function CommentInput(props: {
  replyToUser?: { id: string; username: string }
  // Reply to a free response answer
  parentAnswerOutcome?: string
  // Reply to another comment
  parentCommentId?: string
  onSubmitComment?: (editor: Editor, betId: string | undefined) => void
  className?: string
  presetId?: string
}) {
  const {
    parentAnswerOutcome,
    parentCommentId,
    replyToUser,
    onSubmitComment,
    presetId,
  } = props
  const user = useUser()

  const { editor, upload } = useTextEditor({
    simple: true,
    max: MAX_COMMENT_LENGTH,
    placeholder:
      !!parentCommentId || !!parentAnswerOutcome
        ? 'Write a reply...'
        : 'Write a comment...',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitComment(betId: string | undefined) {
    if (!editor || editor.isEmpty || isSubmitting) return
    setIsSubmitting(true)
    onSubmitComment?.(editor, betId)
    setIsSubmitting(false)
  }

  if (user?.isBannedFromPosting) return <></>

  return (
    <Row className={clsx(props.className, 'mb-2 gap-1 sm:gap-2')}>
      <Avatar
        avatarUrl={user?.avatarUrl}
        username={user?.username}
        size="sm"
        className="mt-2"
      />
      <div className="min-w-0 flex-1 pl-0.5 text-sm">
        <CommentInputTextArea
          editor={editor}
          upload={upload}
          replyToUser={replyToUser}
          user={user}
          submitComment={submitComment}
          isSubmitting={isSubmitting}
          presetId={presetId}
        />
      </div>
    </Row>
  )
}

export function CommentInputTextArea(props: {
  user: User | undefined | null
  replyToUser?: { id: string; username: string }
  editor: Editor | null
  upload: Parameters<typeof TextEditor>[0]['upload']
  submitComment: (id?: string) => void
  isSubmitting: boolean
  submitOnEnter?: boolean
  presetId?: string
}) {
  const {
    user,
    editor,
    upload,
    submitComment,
    presetId,
    isSubmitting,
    submitOnEnter,
    replyToUser,
  } = props
  const isMobile = (useWindowSize().width ?? 0) < 768 // TODO: base off input device (keybord vs touch)

  useEffect(() => {
    editor?.setEditable(!isSubmitting)
  }, [isSubmitting, editor])

  const submit = () => {
    submitComment(presetId)
    editor?.commands?.clearContent()
  }

  useEffect(() => {
    if (!editor) {
      return
    }
    // submit on Enter key
    editor.setOptions({
      editorProps: {
        handleKeyDown: (view, event) => {
          if (
            submitOnEnter &&
            event.key === 'Enter' &&
            !event.shiftKey &&
            (!isMobile || event.ctrlKey || event.metaKey) &&
            // mention list is closed
            !(view.state as any).mention$.active
          ) {
            submit()
            event.preventDefault()
            return true
          }
          return false
        },
      },
    })
    // insert at mention and focus
    if (replyToUser) {
      editor
        .chain()
        .setContent({
          type: 'mention',
          attrs: { label: replyToUser.username, id: replyToUser.id },
        })
        .insertContent(' ')
        .focus()
        .run()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  return (
    <>
      <TextEditor editor={editor} upload={upload}>
        {user && !isSubmitting && (
          <button
            className="btn btn-ghost btn-sm px-2 disabled:bg-inherit disabled:text-gray-300"
            disabled={!editor || editor.isEmpty}
            onClick={submit}
          >
            <PaperAirplaneIcon className="m-0 h-[25px] min-w-[22px] rotate-90 p-0" />
          </button>
        )}

        {isSubmitting && (
          <LoadingIndicator spinnerClassName={'border-gray-500'} />
        )}
      </TextEditor>
      <Row>
        {!user && (
          <button
            className={'btn btn-outline btn-sm mt-2 normal-case'}
            onClick={() => submitComment(presetId)}
          >
            Add my comment
          </button>
        )}
      </Row>
    </>
  )
}