import styles from './profile.module.css'
import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '../../contexts'
export default function Profile () {
    const { user, socket, socketOn } = useContext(AuthContext);
    const [isFetched, setFetched] = useState(false)
    const [error, setError] = useState(false)
    return (
        <main className={styles.main}>
            <h1>Profile</h1>
        </main>
    )
}