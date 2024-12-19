import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authcontext'

const Header = () => {
    const { userLoggedIn } = useAuth()
    const location = useLocation()

    if (userLoggedIn) {
        return null
    }

    return (
        <nav className='flex flex-row gap-x-2 w-full z-20 fixed top-0 left-0 h-12 place-content-center items-center '>
            <Link
                className={`toggle-button ${location.pathname === '/login' ? 'active' : ''}`}
                to={'/login'}
            >
                Login
            </Link>
            <Link
                className={`toggle-button ${location.pathname === '/register' ? 'active' : ''}`}
                to={'/register'}
            >
                Register
            </Link>
        </nav>
    )
}

export default Header
