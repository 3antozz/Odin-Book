import styles from './sidebar.module.css'
import { NavLink } from 'react-router'
import { useContext, memo } from 'react';
import PropTypes from 'prop-types'
import { AuthContext } from "../../contexts"
import { House, Bell, LogIn, User, LogOut, PencilLine } from 'lucide-react';
const Sidebar = memo(function Sidebar ({notifsCount, setCreatingPost}) {
    const { user, logout } = useContext(AuthContext);
    const confirmLogout = () => {
        const confirm = window.confirm('Are you sure you want to logout?')
        if(!confirm) {
            return;
        }
        logout()
    }
    return (
        <aside className={styles.sidebar}>
            <h2>OdinBook</h2>
            <nav style={{marginBottom: user ? null : '0.8rem'}}>
                <NavLink to='/'>
                    <House size={30} />
                    <p>Home</p>
                </NavLink>
                {user &&
                <NavLink to='/notifications' className={styles.notifications}>
                    <div>
                        <Bell size={30} />
                        {notifsCount > 0 &&
                        <div className={styles.countDiv}>
                            <p className={styles.count}>{notifsCount}</p>
                        </div> 
                        }
                    </div>
                    <p>Notifications</p>
                </NavLink>}
                {user && 
                <NavLink to={`/profile/${user.id}`} className={styles.user}>
                    <img src={user?.picture_url || '/no-profile-pic.jpg'} alt={`${user?.first_name} ${user?.last_name} profile picture`} />
                    <p>Profile</p>
                </NavLink>}
                {user && 
                <button className={styles.post} onClick={() => setCreatingPost(true)}>
                    <PencilLine size={30} />
                    <p>Post</p>
                </button>}
            </nav>
            {user ? 
            <button className={styles.logout} onClick={confirmLogout}>
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
    setCreatingPost: PropTypes.func.isRequired,
}

export default Sidebar;