import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const PrivateRoute = ({ children }) => {
    const {user, loading} = useSelector((state) => state.auth)
    if(loading) return <h4 className='text-9xl text-white text-center' >Loading...</h4>

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return children
}
export default PrivateRoute
