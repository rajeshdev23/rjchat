import React, { useState } from 'react'
import Input from '../../utils/Input'
import Button from '../../utils/Button'
import { MdOutlineAttachFile, MdClose } from "react-icons/md";
import { useSelector } from 'react-redux';
import { arrayUnion, doc, serverTimestamp, Timestamp, updateDoc, setDoc, increment, getDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { v4 as uuid } from 'uuid';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const InputChat = ({ replyMessage, setReplyMessage }) => {
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)

  const { user, profile } = useSelector((state) => state.auth)
  const { chatId, user: chatUser } = useSelector((state) => state.chat)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() && attachments.length === 0) return;
    if (chatId === "null") return alert("Please select a chat first");

    const messageText = text;
    const currentAttachments = [...attachments];
    const currentReply = replyMessage;

    // Optimistic update: Clear input immediately
    setText("")
    setAttachments([])
    if (setReplyMessage) setReplyMessage(null);

    if (currentAttachments.length > 0) {
      setLoading(true)
    }

    // Use profile.name if available, otherwise fallback to user.displayName, then "User"
    const senderName = profile?.name || user?.displayName || "User";

    try {
      // 1. Send Text Message (if exists)
      if (messageText.trim()) {
        const newMessage = {
          id: uuid(),
          text: messageText,
          senderId: user.uid,
          senderName: senderName,
          date: Timestamp.now(),
          status: "sent",
        };

        if (currentReply) {
          newMessage.replyTo = {
            id: currentReply.id,
            text: currentReply.text || (currentReply.file ? "Attachment" : "Image"),
            senderName: currentReply.senderName || "User"
          };
        }

        await updateDoc(doc(db, "chats", chatId), {
          messages: arrayUnion(newMessage)
        });
      }

      // 2. Send Each Attachment as a Separate Message
      for (const file of currentAttachments) {
        const storageRef = ref(storage, `images/${uuid()}`);

        const metadata = {
          contentType: file.type,
          customMetadata: {
            originalName: file.name
          },
          contentDisposition: `attachment; filename="${file.name}"`
        };

        const uploadTask = await uploadBytesResumable(storageRef, file, metadata);
        const downloadURL = await getDownloadURL(uploadTask.ref);

        const isImage = file.type.startsWith("image/");

        const newMessage = {
          id: uuid(),
          text: "", // Attachments sent separately don't have text
          senderId: user.uid,
          senderName: senderName,
          date: Timestamp.now(),
          status: "sent",
        };

        if (isImage) {
          newMessage.img = downloadURL;
        } else {
          newMessage.file = {
            url: downloadURL,
            name: file.name,
            type: file.type
          };
        }

        // Attachments can also be replies if sent together with reply context
        if (currentReply && !messageText.trim()) { // Only attach reply to first message if multiple
          newMessage.replyTo = {
            id: currentReply.id,
            text: currentReply.text || "Attachment",
            senderName: currentReply.senderName || "User"
          };
        }

        await updateDoc(doc(db, "chats", chatId), {
          messages: arrayUnion(newMessage)
        });
      }

      // 3. Update Last Message for Sidebar
      let lastMessageText = "";
      if (messageText.trim()) {
        lastMessageText = messageText;
      } else if (currentAttachments.length > 0) {
        const count = currentAttachments.length;
        const firstType = currentAttachments[0].type.startsWith("image/") ? "Image" : "File";
        lastMessageText = count > 1 ? `📎 ${count} Attachments` : `📎 ${firstType}`;
      }

      // Update for Current User
      await setDoc(doc(db, "userChats", user.uid), {
        [chatId]: {
          lastMessage: {
            text: lastMessageText
          },
          date: serverTimestamp()
        }
      }, { merge: true });

      // Update for Other User(s)
      if (chatUser.isGroup) {
        // For groups, we need to update all participants
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (chatDoc.exists()) {
          const participants = chatDoc.data().participants || [];

          // Update for everyone except sender (sender already updated above)
          const otherParticipants = participants.filter(uid => uid !== user.uid);

          await Promise.all(otherParticipants.map(uid =>
            setDoc(doc(db, "userChats", uid), {
              [chatId]: {
                lastMessage: {
                  text: lastMessageText
                },
                date: serverTimestamp(),
                unreadCount: increment(1)
              }
            }, { merge: true })
          ));
        }
      } else {
        // 1-on-1 Chat
        await setDoc(doc(db, "userChats", chatUser.uid), {
          [chatId]: {
            lastMessage: {
              text: lastMessageText
            },
            date: serverTimestamp(),
            unreadCount: increment(1)
          }
        }, { merge: true });
      }

    } catch (error) {
      console.error(error)
      alert("Error sending message: " + error.message)
      // Restore text if error (optional, but good UX)
      if (attachments.length === 0) setText(messageText);
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <div className='w-full flex flex-col'>
      {/* Reply Preview */}
      {replyMessage && (
        <div className="px-4 py-2 bg-[#1f2c34] border-l-4 border-teal-500 flex justify-between items-center animate-slide-up">
          <div className="flex flex-col">
            <span className="text-teal-500 text-sm font-medium">Replying to {replyMessage.senderName || "User"}</span>
            <span className="text-gray-400 text-xs truncate max-w-[300px]">
              {replyMessage.text || (replyMessage.file ? "Attachment" : "Image")}
            </span>
          </div>
          <button onClick={() => setReplyMessage(null)} className="text-gray-400 hover:text-white">
            <MdClose size={20} />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-gray-700 flex justify-between items-center border-b border-gray-600">
          <span className="text-sm text-gray-300 truncate max-w-[80%]">
            {attachments.length} file(s) selected: {attachments.map(f => f.name).join(", ")}
          </span>
          <button
            onClick={() => setAttachments([])}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove All
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
            multiple
            onChange={handleFileChange}
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