import styles from './most-followed.module.css'
import { memo, useState, useEffect } from 'react'
import { Link } from 'react-router';
import { LoaderCircle, Image, Trash, Search } from 'lucide-react';
import { formatNumber } from '../../date-format'

const MostFollowed = memo(function CreatePost () {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [isFetched, setFetched] = useState(false)
    useEffect(() => {
        const fetchUsers = async() => {
            try {
                setLoading(true)
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/most-followed`, {
                    credentials: 'include',
                })
                if(request.status === 401) {
                    window.location.href = '/login';
                }
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                const response = await request.json();
                console.log(response)
                setUsers(response.users);
                setFetched(true)
                setError(false)
            } catch(err) {
                console.error(err);
                setError(true)
            } finally {
                setLoading(false)
            }
        }
        if(!isFetched) {
            fetchUsers();
        }
    }, [isFetched])
    return (
        <section className={styles.container}>
            <h3>Most Followed</h3>
            {loading ? 
            <div className={styles.loadingDiv}>
                <LoaderCircle className={styles.loading} size={30} />
            </div> :
            error ?
            <div className={styles.loadingDiv}>
                <p>Error loading content</p>
            </div> :
            <ul className={styles.result}>
                {users.map(user => 
                <li className={styles.member} key={user.id}>
                    <Link to={`/profile/${user.id}`} className={styles.memberButton}>
                        <img src={user.picture_url || '/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`}></img>
                        <p>{user.first_name} {user.last_name}</p>
                        <small><em>{formatNumber(user._count.followers)}</em> {user._count.followers === 1 ? 'Follower' : 'Followers'}</small>
                    </Link>
                </li>
                )}
            </ul>
            }
        </section>
    )
})



MostFollowed.propTypes = {
}

export default MostFollowed;



