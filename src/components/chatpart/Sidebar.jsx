import React, { useEffect, useState } from 'react'
import Navbar from './Navbar'
import Search from './Search'
import Chats from './Chats'
import StatusList from './StatusList'
import { MdChat, MdDonutLarge, MdGroups } from "react-icons/md";

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState("chats"); // 'chats', 'status', 'communities'

  return (
    <div className='sidebar flex-[1] bg-[#111b21] border-r border-gray-700 relative flex flex-col h-full'>
      <Navbar />

      {/* Tab Bar */}
      <div className="flex items-center justify-around bg-[#111b21] border-b border-gray-700 h-[50px]">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 h-full flex items-center justify-center text-gray-400 hover:bg-[#202c33] transition relative ${activeTab === "chats" ? "!text-teal-500" : ""}`}
        >
          <MdChat size={24} />
          {activeTab === "chats" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("status")}
          className={`flex-1 h-full flex items-center justify-center text-gray-400 hover:bg-[#202c33] transition relative ${activeTab === "status" ? "!text-teal-500" : ""}`}
        >
          <MdDonutLarge size={24} />
          {activeTab === "status" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-t-full" />}
        </button>
        {/* Placeholder for Communities/Groups tab if needed later */}
        <button
          className="flex-1 h-full flex items-center justify-center text-gray-400 hover:bg-[#202c33] transition opacity-50 cursor-not-allowed"
          title="Communities (Coming Soon)"
        >
          <MdGroups size={24} />
        </button>
      </div>

      {activeTab === "chats" ? (
        <>
          <Search />
          <Chats />
        </>
      ) : (
        <StatusList />
      )}
    </div>
  )
}

export default Sidebar
