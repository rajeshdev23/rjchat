import React, { useEffect, useState, useRef } from 'react'
import Message from './Message'
import { useSelector } from 'react-redux'
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { MessageSkeleton } from '../../components/utils/Skeleton'

const Messages = ({ selectionMode, selectedMessages, onSelectMessage, setReplyMessage }) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const { chatId, user: chatUser } = useSelector((state) => state.chat)
  const { user } = useSelector((state) => state.auth)
  const scrollRef = useRef()

  useEffect(() => {
    setLoading(true) // Reset loading when chat changes
    const unSub = onSnapshot(doc(db, "chats", chatId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMessages(data.messages);

        // Mark messages as seen if they are from the other user and not yet seen
        const unreadMessages = data.messages.filter(
          m => m.senderId !== user.uid && m.status !== "seen"
        );

        if (unreadMessages.length > 0) {
          const updatedMessages = data.messages.map(m => {
            if (m.senderId !== user.uid && m.status !== "seen") {
              return { ...m, status: "seen" };
            }
            return m;
          });

          // Use a timeout or separate effect to avoid rapid updates if needed, 
          // but direct update here is standard for this simple logic
          updateDoc(snapshot.ref, {
            messages: updatedMessages
          }).catch(err => console.error("Error marking seen:", err));

          // Also reset unread count for the current user since they are viewing the chat
          updateDoc(doc(db, "userChats", user.uid), {
            [`${chatId}.unreadCount`]: 0
          }).catch(err => console.error("Error resetting unread count:", err));
        }
      }
      setLoading(false)
    })

    return () => {
      unSub()
    }
  }, [chatId, user.uid])

  // Auto scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }, [messages])

  const handleDeleteSingle = async (messageId) => {
    if (window.confirm("Delete this message?")) {
      try {
        const chatRef = doc(db, "chats", chatId);
        const snapshot = await getDoc(chatRef);

        if (snapshot.exists()) {
          const currentMessages = snapshot.data().messages;
          const updatedMessages = currentMessages.filter(m => m.id !== messageId);

          await updateDoc(chatRef, {
            messages: updatedMessages
          });
        }
      } catch (err) {
        console.error("Error deleting message:", err);
      }
    }
  };

  return (
    <div className="messages w-full flex flex-col gap-4">
      {loading ? (
        <MessageSkeleton />
      ) : (
        messages.map((m) => (
          <div ref={scrollRef} key={m.id}>
            <Message
              message={m}
              selectionMode={selectionMode}
              isSelected={selectedMessages?.has(m.id)}
              onSelect={() => onSelectMessage(m.id)}
              onDelete={() => handleDeleteSingle(m.id)}
              isGroup={chatUser?.isGroup}
              onReply={() => setReplyMessage(m)}
            />
          </div>
        ))
      )}
    </div>
  )
}

export default Messages