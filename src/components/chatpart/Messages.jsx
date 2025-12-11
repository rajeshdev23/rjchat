import React, { useEffect, useState, useRef } from 'react'
import Message from './Message'
import { useSelector } from 'react-redux'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { MessageSkeleton } from '../../components/utils/Skeleton'

const Messages = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const { chatId } = useSelector((state) => state.chat)
  const scrollRef = useRef()

  useEffect(() => {
    setLoading(true) // Reset loading when chat changes
    const unSub = onSnapshot(doc(db, "chats", chatId), (doc) => {
      doc.exists() && setMessages(doc.data().messages)
      setLoading(false)
    })

    return () => {
      unSub()
    }
  }, [chatId])

  // Auto scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }, [messages])

  return (
    <div className="messages w-full flex flex-col gap-4">
      {loading ? (
        <MessageSkeleton />
      ) : (
        messages.map((m) => (
          <div ref={scrollRef} key={m.id}>
            <Message message={m} />
          </div>
        ))
      )}
    </div>
  )
}

export default Messages