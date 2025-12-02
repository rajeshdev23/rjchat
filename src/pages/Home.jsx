import React from 'react'
import Sidebar from '../components/chatpart/Sidebar'
import Chat from '../components/chatpart/Chat'
import "../style.css"

const Home = () => {
  return (
    <main className="text-white w-full h-[100vh] overflow-auto grid grid-cols-1 md:grid-cols-12 bg-gray-900">

      {/* Sidebar */}
      <aside className="col-span-12 md:col-span-4 bg-gray-800 border-r border-gray-700">
        <Sidebar />
      </aside>

      {/* Chat Area */}
      <section className="col-span-12 md:col-span-8 bg-gray-900">
        <Chat />
      </section>

    </main>
  )
}

export default Home
