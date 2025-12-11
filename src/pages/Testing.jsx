import React from 'react'
import { useSelector } from 'react-redux'

const Testing = () => {
    const { user } = useSelector((state) => state.auth)
    console.log(user)

    return (
        <div className='w-full h-[100vh] bg-gray-900'>
            <div className='w-full h-full flex justify-center items-center'>
                Testing
            </div>
        </div>
    )
}

export default Testing
