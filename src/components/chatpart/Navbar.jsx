import React, { useState } from 'react'
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/authSlice';
import { signOut } from 'firebase/auth';
import { Auth } from '../../firebase';
import { MdDonutLarge } from "react-icons/md";
import { BsFillChatLeftTextFill } from "react-icons/bs";
import { HiDotsVertical } from "react-icons/hi";

const Navbar = () => {
  const dispatch = useDispatch()
  const [showMenu, setShowMenu] = useState(false);
  const { user, profile } = useSelector((state) => state.auth);

  const handleLogout = () => {
    signOut(Auth)
    dispatch(logout())
  }

  return (
    <nav className="w-full bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center relative z-20">
      {/* Left: User Avatar */}
      <div className="flex items-center">
        {profile?.avatar ? (
          <img
            src={profile.avatar}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
            onClick={() => {/* Maybe navigate to profile? */ }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-600 animate-pulse"></div>
        )}
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-6 text-gray-400">
        <button className="hover:text-white transition" title="Status">
          <MdDonutLarge size={22} />
        </button>
        <button className="hover:text-white transition" title="New Chat">
          <BsFillChatLeftTextFill size={20} />
        </button>
        <div className="relative">
          <button
            className="hover:text-white transition"
            title="Menu"
            onClick={() => setShowMenu(!showMenu)}
          >
            <HiDotsVertical size={22} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded shadow-lg py-2 w-40 z-50">
              <NavLink
                to="/profile"
                className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition"
                onClick={() => setShowMenu(false)}
              >
                Profile
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close menu when clicking outside */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </nav>
  )
}

export default Navbar
