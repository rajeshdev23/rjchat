import React, { useEffect, useState, useRef } from 'react'
import Message from './Message'
import { useSelector } from 'react-redux'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'

const Messages = () => {
  const [messages, setMessages] = useState([])
  const { chatId } = useSelector((state) => state.chat)
  const scrollRef = useRef()

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (doc) => {
      doc.exists() && setMessages(doc.data().messages)
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
      {messages.map((m) => (
        <div ref={scrollRef} key={m.id}>
          <Message message={m} />
        </div>
      ))}
    </div>
  )
}

export default Messages