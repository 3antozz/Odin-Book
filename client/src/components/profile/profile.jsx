import styles from './profile.module.css'
import { useState, useContext, useEffect, useMemo } from 'react'
import { useOutletContext, useParams, Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { AuthContext } from '../../contexts'
import Post from '../post/post'
export default function Profile () {
    const { user, socket } = useContext(AuthContext);
    const [profiles, setProfiles] = useState({})
    const { userId }  = useParams();
    const { setPosts } = useOutletContext();
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
    }, [userId, profiles])
    if(!profile || !user) {
        return;
    }
    return (
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                <h1>Profile</h1>
            </header>
            {profile.posts.map(post => <Post key={post.id} post={post} setPosts={setPosts} setProfile={setProfiles} />)}
        </main>
    )
}