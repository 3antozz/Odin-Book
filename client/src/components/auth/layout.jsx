import styles from './layout.module.css'
import { useContext } from 'react'
import { Outlet, Navigate } from 'react-router'
import { AuthContext } from "../../contexts"

export default function AuthLayout () {
    const { user } = useContext(AuthContext)
    if(user) {
        return <Navigate to='/' replace />
    }
    return (
        <div className={styles.container}>
        <section className={styles.brand}>
            <div>
                <img src="/images/logo.png" alt="AntodiA logo" />
                <h1>AntodiA</h1>
            </div>
        </section>
        <section className={styles.form}>
            <h1>Join Today</h1>
            <Outlet />
        </section>
        </div>
    )
}