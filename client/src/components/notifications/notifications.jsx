import styles from './notifications.module.css'
import { useState, useContext, useEffect } from 'react'
import Post from '../post/post'
import { AuthContext } from '../../contexts'
export default function Notifications () {
    const { user, socket, socketOn } = useContext(AuthContext);
    const [isFetched, setFetched] = useState(false)
    const [error, setError] = useState(false)
    return (
        <main className={styles.main}>
            <h1>Notifications</h1>
        </main>
    )
}