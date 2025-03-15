import { useState, useRef, useEffect } from 'react'
import { AuthContext } from './contexts.js';
import { Routes, Route } from "react-router";
import AuthLayout from './components/auth/layout.jsx';
import Login from './components/auth/login.jsx';
import Register from './components/auth/register.jsx';
import ErrorPage from './components/error/Error.jsx'
import { io } from "socket.io-client";
import './App.css'

function App() {
  const token = useRef(null)
  const [user, setUser] = useState(null)
  const timeoutRef = useRef(null);
  const [isFetched, setFetched] = useState(false)
  const [isAuthenticated, setAuthentication] = useState(false)
  const socket = useRef(null)
  const [socketOn, setSocket] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const request = await fetch(`${import.meta.env.VITE_API_URL}/users/user`, {
          headers: {
            'Authorization': `Bearer ${token.current}`
          }
        })
        if(!request.ok) {
          const error = new Error('An error has occured, please try again later')
          throw error;
        }
        const response = await request.json();
        setUser(response.user);
        setFetched(true)
        setAuthentication(true)
      // eslint-disable-next-line no-unused-vars
      } catch(err) {
        setFetched(false)
      }
    }
    if(!isFetched && isAuthenticated) {
      if(!user) {
        fetchUser();
      }
    }
  }, [isFetched, user, isAuthenticated, token])

  useEffect(() => {
    if(user && isAuthenticated && !socketOn) {
      socket.current = io(`${import.meta.env.VITE_API_URL}`, {
        query: {
          userId: user.id
        }
      });
      setSocket(true)
    }
  }, [isAuthenticated, socketOn, user])

  return (
    <AuthContext.Provider value={{token, user, setUser, setAuthentication, socketOn, socket, timeoutRef}}>
        <Routes>
            <Route path="/" element={<Messenger />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route path="*" element={<ErrorPage />} />
        </Routes>
    </AuthContext.Provider>
  )
}

export default App
