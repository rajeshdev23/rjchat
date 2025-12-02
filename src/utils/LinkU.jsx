import React from 'react'
import { Link } from 'react-router-dom'

const LinkU = ({ url, text, className = "", ...props }) => {
  return (
    <Link
      to={url}
      className={`text-blue-600 hover:text-blue-800 transition-all duration-200 ${className}`}
      {...props}
    >
      {text}
    </Link>
  )
}

export default LinkU
