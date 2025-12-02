import React from 'react'
import { NavLink } from 'react-router-dom'
import LinkU from '../utils/LinkU'


const Header = () => {
  return (
    <>
    <nav>
        <ul>
            <li><NavLink to={''} >Home</NavLink></li>
            <li><NavLink to={'about'} >About</NavLink></li>
            <li><LinkU url={'/register'} text={'Register Now'}/></li>
        </ul>
    </nav>
    </>
  )
}

export default Header