import styles from './layout.module.css'
import { useState } from "react"
import { useNavigate, Link, useParams } from "react-router"
import { useContext } from 'react'
import { AuthContext } from "../../contexts"
import Popup from "../popup/popup"
import { LoaderCircle } from 'lucide-react'
export default function SetPassword () {
    const navigate = useNavigate();
    const { userId } = useParams();
    const { user, setAuthentication } = useContext(AuthContext);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState(null);
    const [success, setSuccess] = useState(false);
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
                    password,
                    confirm_password: confirmPassword
                })
            })
            const response = await request.json();
            console.log(response);
            if(!request.ok) {
                const error = new Error(response.message || 'Invalid Request')
                error.errors = response.errors;
                throw error
            }
            setSuccess(true)
            setTimeout(() => {
                if(!success) {
                    setSuccess(false)
                }
            }, 2500)
            setErrors(null)
            setAuthentication(true)
            setTimeout(() => {
                navigate('/')
                setLoading(false)
            }, 3000)
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

    if(!user || user.id != userId) {
        return <h1>Unauthrorized Access</h1>
    }

    if(user?.pw_set) {
        return <h1>Password already set</h1>
    }


    return (
        <>
        <Popup shouldRender={success} close={setSuccess} borderColor='#00d846'>
            <p>Password Set!</p>
        </Popup>
        <form onSubmit={handleSubmit} className={styles.login}>
            {errors && 
            <ul>
                {errors.map((error, index) => <li key={index}><p>✘ {error}</p></li>)}
            </ul>
            }
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