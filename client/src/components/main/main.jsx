import styles from './main.module.css'
import Sidebar from '../sidebar/sidebar'
import { Outlet } from 'react-router'
import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../contexts'
export default function Main () {
    const { user, socket } = useContext(AuthContext);
    const [posts, setPosts] = useState({})
    const [fullPosts, setFullPosts] = useState({})
    const [profiles, setProfiles] = useState({})
    const [isFetched, setFetched] = useState(false)
    const [postsLoading, setPostsLoading] = useState(false)
    const [error, setError] = useState(false)
    useEffect(() => {
        const fetchPosts = async() => {
            setPostsLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/posts/following`, {
                    credentials: 'include'
                })
                const response = await request.json();
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                console.log(response);
                const posts = {};
                response.posts.forEach((post) => posts[post.id] = post)
                setPosts(posts)
                setError(false)
                setFetched(true)
            } catch(err) {
                console.log(err)
                setError(true)
            } finally {
                setPostsLoading(false)
            }
        }
        if(!isFetched && user) {
            fetchPosts();
        }
    }, [isFetched, user])
    return (
        <div className={styles.main}>
            <Sidebar />
            <Outlet context={{posts, setPosts, postsLoading, error, fullPosts, setFullPosts, profiles, setProfiles}} />
        </div>
    )
}