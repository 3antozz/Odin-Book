import styles from './layout.module.css'
import { useState } from "react"
import { Link, Navigate } from "react-router"
import { useContext } from 'react'
import { AuthContext } from "../../contexts"
import Popup from "../popup/popup"
import { LoaderCircle } from 'lucide-react'
export default function Login () {
    const { user, setAuthentication } = useContext(AuthContext)
    const [success, setSuccess] = useState(false);
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState(null);
    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            setLoading(true)
            const request = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            })
            const response = await request.json();
            
            if(!request.ok) {
                const error = new Error(response.message || 'Invalid Request')
                error.errors = response.errors;
                throw error
            }
            setSuccess(true)
            setTimeout(() => {
                setSuccess(false)
                setLoading(false)
            }, 3000)
            setErrors(null)
            setAuthentication(true)
        } catch(err) {
            if(err.errors) {
                setErrors(err.errors)
            } else {
                setErrors([err.message])
            }
        } finally {
            setLoading(false);
        }
    }
    if(user && !success) {
        return <Navigate to='/' replace />
    }
    return (
        <>
        <Popup shouldRender={success} close={setSuccess} borderColor='#00d846'>
            <p>Login successful...</p>
        </Popup>
        <form onSubmit={handleSubmit} className={styles.login}>
            {errors && 
            <ul>
                {errors.map((error, index) => <li key={index}><p>✘ {error}</p></li>)}
            </ul>
            }
            <div className={styles.input}>
                <label htmlFor="username" hidden>Username</label>
                <input type="text" id="username" required value={username} placeholder="Username" onChange={(e) => setUsername(e.target.value)}  />
            </div>
            <div>
                <label htmlFor="password" hidden>Password</label>
                <input type="password" id="password" required value={password} placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button disabled={success ? true : loading ? true : false}>{loading ? <LoaderCircle size={40} color='white' className={styles.loading}/> : 'Log in'}</button>
            <button type='button' className={styles.github} onClick={() => window.location.href=`${import.meta.env.VITE_API_URL}/auth/github`}> 
                <i className="devicon-github-original"></i>
                <p>Sign in with GitHub</p>
            </button> 
            <div>
                <Link to='/register'>Create an Account</Link> 
                <Link to='/'>Guest Mode</Link>  
            </div>
        </form>
        </>
    )
}