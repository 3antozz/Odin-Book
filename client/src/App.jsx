import { useState, useRef, useEffect } from 'react'
import { AuthContext } from './contexts.js';
import { Routes, Route } from "react-router";
import AuthLayout from './components/auth/layout.jsx';
import Login from './components/auth/login.jsx';
import Register from './components/auth/register.jsx';
import ErrorPage from './components/error/Error.jsx'
import SetPassword from './components/auth/set-password.jsx';
import { io } from "socket.io-client";
import Main from './components/main/main.jsx';
import Notifications from './components/notifications/notifications.jsx';
import Profile from './components/profile/profile.jsx';
import Index from './components/index/index.jsx'
import FullscreenPost from './components/fullscreen-post/fullscreen-post.jsx'
import './App.css'
function App() {
  const [user, setUser] = useState(null)
  const [isFetched, setFetched] = useState(false)
  const [isAuthenticated, setAuthentication] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const socket = useRef(null)
  const [socketOn, setSocket] = useState(false)

  const logout = async() => {
    try {
      const request = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      if(!request.ok) {
        const error = new Error('An error has occured, please try again later')
        throw error;
      }
      window.location.href = '/login';
    } catch(err) {
      console.log(err)
      setFetched(false)
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true)
        const request = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
          credentials: 'include'
        })
        if(!request.ok) {
          const error = new Error('An error has occured, please try again later')
          throw error;
        }
        const response = await request.json();
        console.log(response);
        setUser(response.user);
        setFetched(true)
        setAuthentication(true)
      // eslint-disable-next-line no-unused-vars
      } catch(err) {
        setFetched(false)
      } finally {
        setLoadingUser(false)
      }
    }
    if(!isFetched && !isAuthenticated) {
      if(!user) {
        fetchUser();
      }
    } else if(!isFetched && isAuthenticated) {
      if(!user) {
        fetchUser();
      }
    }
  }, [isFetched, user, isAuthenticated])

  useEffect(() => {
    if(user && isAuthenticated && !socketOn) {
      socket.current = io(`${import.meta.env.VITE_API_URL}`, {
      withCredentials: true,
        query: {
          userId: user.id
        }
      });
      setSocket(true)
    }
  }, [isAuthenticated, socketOn, user])

  return (
    <AuthContext.Provider value={{user, setUser, loadingUser, setAuthentication, socketOn, socket, logout}}>
        <Routes>
            <Route path="/" element={< Main />}>
              <Route index element={<Index />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/post/:postId" element={<FullscreenPost />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/set-password/:userId" element={<SetPassword />} />
            </Route>
            <Route path="*" element={<ErrorPage />} />
        </Routes>
    </AuthContext.Provider>
  )
}

export default App
