import { Link } from "react-router"
import styles from "./Error.module.css"
export default function ErrorPage () {
    return (
        <div className={styles.error}>
            <h1>404 Not Found</h1>
            <Link to='/'>Click here to go back</Link>
        </div>
    )
}