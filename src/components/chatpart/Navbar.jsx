import React from 'react'
import { CgProfile } from "react-icons/cg";
import { NavLink } from 'react-router-dom';
import Button from '../../utils/Button';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/authSlice';
import { signOut } from 'firebase/auth';
import { Auth } from '../../firebase';

const Navbar = () => {
  const dispatch = useDispatch()
  const handleLogout=()=>{
    signOut(Auth)
    dispatch(logout())
  }
  const {user , profile} = useSelector((state)=> state.auth);
   
  return (
    <nav className="w-full bg-gray-800 border-b border-gray-700 p-2 ">
      <ul className="flex items-center justify-between text-gray-200">
      
        <li className="text-2xl font-semibold tracking-wide">
          <NavLink to="/">
            Rj Chat
          </NavLink>
        </li>

        {/* User Profile */}
        <li>
          {
            profile &&
            <NavLink
            to="/profile"
            className="flex items-center gap-2 hover:text-white transition" 
          >
            <img className='w-[30px]' src={profile.avatar} alt={profile.name} />
            <span>{profile.name}</span>
          </NavLink>
          }
          
        </li>

        {/* Logout Button */}
        <li>
          <Button onClick={()=> handleLogout()} text="Logout" className="px-3 py-1 bg-red-600 hover:bg-red-700" />
        </li>

      </ul>
    </nav>
  )
}

export default Navbar
