import styles from './layout.module.css'
import { useState } from "react"
import { Navigate, useParams } from "react-router"
import { useContext } from 'react'
import { AuthContext } from "../../contexts"
import Popup from "../popup/popup"
import { LoaderCircle } from 'lucide-react'
export default function SetPassword () {
    const { userId } = useParams();
    const { user, setUser, setAuthentication } = useContext(AuthContext);
    const [success, setSuccess] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState(null);
    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            setLoading(true)
            const request = await fetch(`${import.meta.env.VITE_API_URL}/set-password`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    first_name: firstName,
                    last_name: lastName,
                    password,
                    confirm_password: confirmPassword
                })
            })
            const response = await request.json();
            
            if(request.status === 401) {
                window.location.href = '/login';
            }
            if(!request.ok) {
                const error = new Error(response.message || 'Invalid Request')
                error.errors = response.errors;
                throw error
            }
            setSuccess(true)
            setTimeout(() => {
                setSuccess(false)
            }, 3000)
            setErrors(null)
            setAuthentication(true)
            setUser(prev => ({...prev, pw_set: true}))
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

    if((!user || user.id != userId || user?.pw_set) && !success) {
        return <Navigate to='/' replace />
    }


    return (
        <>
        <Popup shouldRender={success} close={setSuccess} borderColor='#00d846'>
            <p>Account Created!</p>
        </Popup>
        <form onSubmit={handleSubmit} className={styles.setPw}>
            <div className={styles.info}>
                <img src={user.picture_url || '/no-profile-pic.jpg'} alt={`${user.username} profile picture`} />
                <p>Welcome <em>{user.username}</em> ! Please finish creating an account so you can login with a password in the future!</p>
            </div>
            {errors && 
            <ul>
                {errors.map((error, index) => <li key={index}><p>✘ {error}</p></li>)}
            </ul>
            }
            <div>
                <label htmlFor="first_name" hidden>First Name</label>
                <input id="first_name" placeholder="First Name" required minLength={2} maxLength={20} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
                <label htmlFor="last_name" hidden>Last Name</label>
                <input id="last_name" placeholder="Last Name" required minLength={2} maxLength={20} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
                <label htmlFor="password" hidden>Password</label>
                <input type="password" id="password" placeholder="Password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
                <label htmlFor="confirm_password" hidden>Confirm Password</label>
                <input type="password" id="confirm_password" placeholder="Confirm Password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div>
                <button disabled={success ? true : loading ? true : false}>{loading ? <LoaderCircle size={40} color='white' className={styles.loading}/> : 'Submit'}</button>
            </div>
        </form>
        </>
    )
}