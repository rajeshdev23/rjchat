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
      {chatList.map((chat) => {
        const userInfo = chat[1].userInfo;
        // Safety check: if userInfo is missing, skip rendering this chat item
        if (!userInfo) return null;

        return (
          <div
            className="userChat p-3 flex items-center gap-3 text-white cursor-pointer hover:bg-gray-700 transition-colors"
            key={chat[0]}
            onClick={() => handleSelect({ user: userInfo, chatId: chat[0] })}
          >
            <img
              // Try photoURL first (new standard), then avatar (legacy), then default
              src={userInfo.photoURL || userInfo.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt=""
              className="w-12 h-12 rounded-full object-cover bg-gray-500"
            />
            <div className="userChatInfo flex flex-col">
              <span className="font-semibold text-lg">{userInfo.displayName || userInfo.name || "User"}</span>
              <p className="text-sm text-gray-400 truncate w-48">{chat[1].lastMessage?.text}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Chats