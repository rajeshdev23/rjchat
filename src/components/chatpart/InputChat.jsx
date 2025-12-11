import React, { useState } from 'react'
import Input from '../../utils/Input'
import Button from '../../utils/Button'
import { MdOutlineAttachFile } from "react-icons/md";
import { useSelector } from 'react-redux';
import { arrayUnion, doc, serverTimestamp, Timestamp, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { v4 as uuid } from 'uuid';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const InputChat = () => {
  const [text, setText] = useState("")
  const [img, setImg] = useState(null)
  const [loading, setLoading] = useState(false)

  const { user } = useSelector((state) => state.auth)
  const { chatId, user: chatUser } = useSelector((state) => state.chat)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text && !img) return;
    if (chatId === "null") return alert("Please select a chat first");

    const messageText = text;
    const messageImg = img;

    // Optimistic update: Clear input immediately
    setText("")
    setImg(null)

    // Only show loading for images
    if (messageImg) {
      setLoading(true)
    }

    try {
      let downloadURL = null;

      if (messageImg) {
        const storageRef = ref(storage, `images/${uuid()}`);
        const uploadTask = await uploadBytesResumable(storageRef, messageImg);
        downloadURL = await getDownloadURL(uploadTask.ref);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          id: uuid(),
          text: messageText,
          senderId: user.uid,
          date: Timestamp.now(),
          status: "sent",
          ...(downloadURL && { img: downloadURL })
        })
      });

      await setDoc(doc(db, "userChats", user.uid), {
        [chatId]: {
          lastMessage: {
            text: messageText || "📷 Image"
          },
          date: serverTimestamp()
        }
      }, { merge: true });

      await setDoc(doc(db, "userChats", chatUser.uid), {
        [chatId]: {
          lastMessage: {
            text: messageText || "📷 Image"
          },
          date: serverTimestamp(),
          unreadCount: increment(1)
        }
      }, { merge: true });

    } catch (error) {
      console.error(error)
      alert("Error sending message: " + error.message)
      // Restore text if error (optional, but good UX)
      if (!messageImg) setText(messageText);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full flex flex-col'>
      {img && (
        <div className="px-4 py-2 bg-gray-700 flex justify-between items-center border-b border-gray-600">
          <span className="text-sm text-gray-300 truncate max-w-[80%]">
            Selected: {img.name}
          </span>
          <button
            onClick={() => setImg(null)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      )}
      <form className=' p-0 w-full flex gap-5 justify-between items-center h-[60px] px-4' onSubmit={handleSend}>
        <div className="textInput w-[85%]">
          <Input
            type='text'
            className=' !rounded-none !w-full !bg-transparent !border-none text-white placeholder-gray-400 focus:ring-0'
            placeholder='Type something...'
            onChange={e => setText(e.target.value)}
            value={text}
          />
        </div>
        <div className="extraMessage w-[15%] flex justify-end items-center gap-3">
          <Input
            type='file'
            id="file"
            className='hidden'
            onChange={e => setImg(e.target.files[0])}
          />
          <label className='flex items-center cursor-pointer text-gray-300 hover:text-white' htmlFor="file">
            <MdOutlineAttachFile size={24} />
          </label>

          <Button
            type='submit'
            text={loading ? 'Sending...' : 'Send'}
            disabled={loading}
            className='!py-1 !px-4 !rounded-lg'
          />
        </div>
      </form>
    </div>
  )
}

export default InputChat