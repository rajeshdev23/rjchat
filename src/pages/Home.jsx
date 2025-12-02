import React from 'react'
import Sidebar from '../components/chatpart/Sidebar'
import Chat from '../components/chatpart/Chat'
import "../style.css"
import { useSelector } from 'react-redux'

const Home = () => {
  const { chatId } = useSelector((state) => state.chat)

  return (
    <main className="text-white w-full h-[100vh] overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-gray-900">

      {/* Sidebar: Hidden on mobile if chat is open */}
      <aside className={`col-span-12 md:col-span-4 bg-gray-800 border-r border-gray-700 ${chatId !== "null" ? 'hidden md:block' : 'block'}`}>
        <Sidebar />
      </aside>

      {/* Chat Area: Hidden on mobile if no chat selected */}
      <section className={`col-span-12 md:col-span-8 bg-gray-900 ${chatId === "null" ? 'hidden md:block' : 'block'}`}>
        <Chat />
      </section>

    </main>
  )
}

export default Home
