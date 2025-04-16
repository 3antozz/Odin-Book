import styles from './sidebar.module.css'
import { NavLink } from 'react-router'
import { useContext, memo } from 'react';
import PropTypes from 'prop-types'
import { AuthContext } from "../../contexts"
import { House, Bell, LogIn, User, LogOut, PencilLine } from 'lucide-react';
const Sidebar = memo(function Sidebar ({notifsCount}) {
    const { user, logout } = useContext(AuthContext);
    return (
        <aside className={styles.sidebar}>
            <h2>OdinBook</h2>
            <nav>
                <NavLink to='/'>
                    <House size={30} />
                    <p>Home</p>
                </NavLink>
                {user &&
                <NavLink to='/notifications' className={styles.notifications}>
                    <div>
                        <Bell size={30} />
                        {notifsCount > 0 && 
                        <p className={styles.count}>{notifsCount}</p>
                        }
                    </div>
                    <p>Notifications</p>
                </NavLink>}
                {user && 
                <NavLink to={`/profile/${user.id}`}>
                    <User size={30} />
                    <p>Profile</p>
                </NavLink>}
                {user && 
                <button className={styles.post}>
                    <PencilLine size={30} />
                    <p>Post</p>
                </button>}
            </nav>
            {user ? 
            <button className={styles.logout} onClick={logout}>
                <LogOut size={30} />
                <p>Logout</p>
            </button> :
            <NavLink className={styles.login} to='/login'>
                <LogIn size={30} />
                <p>Login</p>
            </NavLink>}
        </aside>
    )
})

Sidebar.propTypes = {
    notifsCount: PropTypes.number.isRequired,
}

export default Sidebar;