import React, { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useSelector, useDispatch } from 'react-redux'
import { changeUser } from '../../features/chatSlice'

const Chats = () => {
  const [chats, setChats] = useState([])
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  useEffect(() => {
    const getChats = () => {
      const unsub = onSnapshot(doc(db, "userChats", user.uid), (doc) => {
        setChats(doc.data())
      })

      return () => {
        unsub()
      }
    }

    user.uid && getChats()
  }, [user.uid])

  const handleSelect = (u) => {
    dispatch(changeUser(u))
  }

  // Convert object to array and sort by date
  const chatList = Object.entries(chats || {})?.sort((a, b) => b[1].date - a[1].date)

  return (
    <div className="chats flex flex-col">
      {chatList.map((chat) => (
        <div
          className="userChat p-3 flex items-center gap-3 text-white cursor-pointer hover:bg-gray-700 transition-colors"
          key={chat[0]}
          onClick={() => handleSelect({ user: chat[1].userInfo, chatId: chat[0] })}
        >
          <img
            src={chat[1].userInfo.avatar}
            alt=""
            className="w-12 h-12 rounded-full object-cover bg-gray-500"
          />
          <div className="userChatInfo flex flex-col">
            <span className="font-semibold text-lg">{chat[1].userInfo.name}</span>
            <p className="text-sm text-gray-400 truncate w-48">{chat[1].lastMessage?.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Chats