import React, { useState } from 'react'
import InputChat from './InputChat'
import { FaVideo, FaTrash } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { IoIosPersonAdd } from "react-icons/io";
import { IoArrowBack } from "react-icons/io5";
import { MdClose, MdDelete } from "react-icons/md";
import Messages from './Messages';
import { useSelector, useDispatch } from 'react-redux';
import { resetChat } from '../../features/chatSlice';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import GroupInfoModal from './GroupInfoModal';

const Chat = () => {
  const { user, chatId } = useSelector((state) => state.chat);
  const { user: currentUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [showMenu, setShowMenu] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear this chat? This will remove all messages for everyone.")) {
      try {
        await updateDoc(doc(db, "chats", chatId), {
          messages: []
        });
        setShowMenu(false);
      } catch (err) {
        console.error("Error clearing chat:", err);
      }
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedMessages(new Set());
    setShowMenu(false);
    setReplyMessage(null); // Clear reply when entering selection mode
  };

  const handleSelectMessage = (messageId) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.size === 0) return;

    if (window.confirm(`Delete ${selectedMessages.size} messages?`)) {
      try {
        const { getDoc } = await import('firebase/firestore');
        const chatRef = doc(db, "chats", chatId);
        const snapshot = await getDoc(chatRef);

        if (snapshot.exists()) {
          const messages = snapshot.data().messages;
          const updatedMessages = messages.filter(m => !selectedMessages.has(m.id));

          await updateDoc(chatRef, {
            messages: updatedMessages
          });

          setSelectionMode(false);
          setSelectedMessages(new Set());
        }

      } catch (err) {
        console.error("Error deleting messages:", err);
      }
    }
  };

  const handleHeaderClick = () => {
    if (user?.isGroup) {
      setShowGroupInfo(true);
    }
  };

  return (
    <div className="chatBox flex flex-col justify-between bg-gray-600 h-full overflow-hidden">

      {/* Top Chat Header */}
      <div className="chatInfo flex justify-between items-center w-full px-4 py-3 bg-[#202c33] border-b border-gray-700 h-[60px] relative z-20">
        {selectionMode ? (
          <div className="flex items-center gap-4 w-full">
            <button onClick={toggleSelectionMode} className="text-gray-300 hover:text-white">
              <MdClose size={24} />
            </button>
            <span className="text-white font-medium text-lg flex-1">{selectedMessages.size} Selected</span>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedMessages.size === 0}
              className={`text-red-400 hover:text-red-300 ${selectedMessages.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MdDelete size={24} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 cursor-pointer" onClick={handleHeaderClick}>
              {/* Back Button for Mobile */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(resetChat());
                }}
                className="md:hidden text-gray-300 hover:text-white"
              >
                <IoArrowBack size={24} />
              </button>

              {(user?.avatar || user?.photoURL) && <img src={user?.photoURL || user?.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />}
              <div className="flex flex-col">
                <span className="text-white font-medium text-lg leading-tight">{user?.name || user?.displayName || "Select a chat"}</span>
                {user?.isGroup && <span className="text-xs text-gray-400">Click for group info</span>}
              </div>
            </div>

            <div className="iconBox flex gap-6 items-center text-xl cursor-pointer text-gray-400 relative">
              <FaVideo className="hover:text-white transition" />
              <IoIosPersonAdd className="hover:text-white transition" />
              <div className="relative">
                <HiDotsHorizontal
                  className="hover:text-white transition"
                  onClick={() => setShowMenu(!showMenu)}
                />
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-[#202c33] border border-gray-700 rounded-lg shadow-xl py-2 w-48 z-50">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
                      onClick={toggleSelectionMode}
                    >
                      Select Messages
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition"
                      onClick={handleClearChat}
                    >
                      Clear Chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-600 custom-scrollbar" onClick={() => setShowMenu(false)}>
        <Messages
          selectionMode={selectionMode}
          selectedMessages={selectedMessages}
          onSelectMessage={handleSelectMessage}
          setReplyMessage={setReplyMessage}
        />
      </div>

      {/* Input Box */}
      {!selectionMode && (
        <div className="border-t border-gray-500 bg-gray-700">
          <InputChat
            replyMessage={replyMessage}
            setReplyMessage={setReplyMessage}
          />
        </div>
      )}

      {/* Group Info Modal */}
      {showGroupInfo && (
        <GroupInfoModal onClose={() => setShowGroupInfo(false)} />
      )}
    </div>
  );
};

export default Chat;
