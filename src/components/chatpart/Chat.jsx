import React from 'react'
import InputChat from './InputChat'
import { FaVideo } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { IoIosPersonAdd } from "react-icons/io";
import Messages from './Messages';
import { useSelector } from 'react-redux';

const Chat = () => {
  const { user } = useSelector((state) => state.chat);

  return (
    <div className="chatBox flex flex-col justify-between bg-gray-600  h-[100vh] overflow-hidden">

      {/* Top Chat Header */}
      <div className="chatInfo flex justify-between items-center w-full px-4 py-3 bg-[#202c33] border-b border-gray-700 h-[60px]">
        <div className="flex items-center gap-4">
          {user?.avatar && <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />}
          <span className="text-white font-medium text-lg">{user?.name || "Select a chat"}</span>
        </div>

        <div className="iconBox flex gap-6 items-center text-xl cursor-pointer text-gray-400">
          <FaVideo className="hover:text-white transition" />
          <IoIosPersonAdd className="hover:text-white transition" />
          <HiDotsHorizontal className="hover:text-white transition" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-600">
        <Messages />
      </div>

      {/* Input Box */}
      <div className="border-t border-gray-500 bg-gray-700">
        <InputChat />
      </div>
    </div>
  );
};

export default Chat;
