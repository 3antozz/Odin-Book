import styles from './profile.module.css'
import { useState, useContext, useEffect, useMemo } from 'react'
import { useOutletContext, useParams, Link } from 'react-router'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { AuthContext } from '../../contexts'
import Post from '../post/post'
export default function Profile () {
    const { user, socket } = useContext(AuthContext);
    const { userId }  = useParams();
    const { setPosts, profiles, setProfiles } = useOutletContext();
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const profile = useMemo(() => profiles[userId], [userId, profiles])
    useEffect(() => {
        const fetchProfile = async() => {
            setLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
                    credentials: 'include'
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                  }
                const response = await request.json();
                console.log(response)
                setProfiles((prev) => ({...prev, [response.profile.id]: response.profile}))
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true);
            } finally {
                setLoading(false)
            }
        }
        if(userId) {
            const profile = profiles[userId];
            if(!profile) {
                fetchProfile();
            }
        }
    }, [userId, profiles, setProfiles])
    if(!profile || !user) {
        return;
    }
    return (
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                <h1>{profile.first_name}&apos;s Profile</h1>
            </header>
            <div className={styles.container}>
                <section className={styles.info}>
                    <div className={styles.left}>
                        <img src={profile.picture_url || '/no-profile-pic.jpg'} alt={`${profile.first_name} ${profile.last_name} profile picture`} />
                    </div>
                    <div className={styles.right}>
                        <div className={styles.top}>
                            <p className={styles.name}>{profile.first_name} {profile.last_name}</p>
                            {profile.id !== user.id ? <button style={{backgroundColor: profile.isFollowed ? 'red' : 'grey'}}>{profile.isFollowed ? 'Unfollow' : 'Follow'}</button> :
                            <button style={{color: 'black'}}>Edit Profile</button>}
                        </div>
                        <p className={styles.bio}>{profile.bio}</p>
                        <div className={styles.followage}>
                            <Link to={'/users'}><em>{profile.following.length}</em> &nbsp;Following</Link>
                            <Link to={'/users'}><em>{profile.followers.length}</em> &nbsp;Followers</Link>
                            <p><em>{profile.posts.length}</em> &nbsp;Posts</p>
                        </div>
                        <div className={styles.joinDate}>
                            <CalendarDays size={20} color='rgb(149, 149, 149)' />
                            <p>Joined {profile.join_date}</p>
                        </div>
                    </div>
                </section>
                <h2>Posts</h2>
                {profile.posts.map(post => <Post key={post.id} post={post} setPosts={setPosts} setProfile={setProfiles} />)}
            </div>
        </main>
    )
}