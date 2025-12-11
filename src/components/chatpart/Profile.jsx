import React from 'react'
import { CgProfile } from "react-icons/cg";

const Profile = ({name, imgUrl , handleClick }) => {
  return (
    <div onClick={()=>handleClick} className="flex items-center gap-3 p-4 bg-gray-800 border-b border-gray-700 hover:bg-gray-900 cursor-pointer">
      
      <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full">
       <img src={imgUrl} alt={name} />
      </div>
      
      <div>
        <h4 className="text-white font-medium">{name}</h4>
        <p className="text-gray-400 text-sm">last messsage</p>
      </div>
    </div>
  )
}

export default Profile ;
