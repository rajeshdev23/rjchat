import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

import { FullPageSkeleton } from '../components/utils/Skeleton'

const RedirectIfLogedIn = ({ children }) => {
    const { user, loading } = useSelector((state) => state.auth)
    if (loading) return <FullPageSkeleton />

    if (user) {
        return <Navigate to="/" replace />
    }

    return children
}

export default RedirectIfLogedIn
