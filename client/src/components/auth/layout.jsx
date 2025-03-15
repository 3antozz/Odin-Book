import styles from './layout.module.css'
import { Outlet } from 'react-router'

export default function AuthLayout () {
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