import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const RedirectIfLogedIn = ({ children }) => {
    const {user,loading} = useSelector((state) => state.auth)
    if(loading) return <h4 className='text-9xl text-white' >Loading...</h4>

    if (user) {
        return <Navigate to="/" replace />
    }

    return children
}

export default RedirectIfLogedIn
