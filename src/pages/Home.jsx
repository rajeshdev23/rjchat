import React from 'react'
import Sidebar from '../components/chatpart/Sidebar'
import Chat from '../components/chatpart/chat'
import "../style.css"

const Home = () => {
  return (
    <main className="text-white grid  w-full  h-[100vh] overflow-y-hidden grid-cols-12 bg-gray-900">

      {/* Sidebar */}
      <aside className="col-span-4 bg-gray-800 border-r border-gray-700  ">
        <Sidebar />
      </aside>

      {/* Chat Area */}
      <section className="col-span-8 bg-gray-900 ">
        <Chat />
      </section>

    </main>
  )
}

export default Home
