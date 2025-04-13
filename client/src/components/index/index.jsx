import styles from './index.module.css'
import { useState, useContext, useMemo } from 'react'
import { useOutletContext } from 'react-router'
import Post from '../post/post'
import PropTypes from 'prop-types'
import { AuthContext } from '../../contexts'
export default function Index () {
    const { user, socket, socketOn } = useContext(AuthContext);
    const { posts, setPosts, profiles, setProfiles, setFullPosts } = useOutletContext();
    const postsArray = useMemo(() => Object.values(posts).reverse(), [posts])
    return (
        <main className={styles.main}>
            <AddPost setPosts={setPosts} profiles={profiles} setProfiles={setProfiles} setFullPosts={setFullPosts} />
            {postsArray.map(post => <Post key={post.id} post={post} setPosts={setPosts} setProfiles={setProfiles} setFullPosts={setFullPosts} />)}
        </main>
    )
}


function AddPost ({setPosts, profiles, setProfiles}) {
    const [postTxt, setPostTxt] = useState('')
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false)
    const createPost = async(e) => {
        e.preventDefault();
        if(!postTxt) {
            return;
        }
        setLoading(true)
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/posts/text`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    content: postTxt
                })
            })
            const response = await request.json();
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            console.log(response)
            setPosts(prev => ({[response.post.id]: response.post, ...prev}))
            if(profiles[response.post.authorId]) {
                setProfiles(prev => {
                    const profileId = response.post.authorId;
                    const profile = prev[profileId];
                    const posts = [response.post, ...profile.posts];
                    return {...prev, [profileId]: {...prev[profileId], posts}}
                })
            }
            setError(false)
            setPostTxt('')
        } catch(err) {
            console.log(err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    return (
        <section className={styles.happening}>
            <form onSubmit={createPost}>
                <label htmlFor="post"></label>
                <textarea placeholder="What's happening?" value={postTxt} onChange={(e) => setPostTxt(e.target.value)} id="post"></textarea>
                <button>Post</button>
            </form>
        </section>
    )
}

AddPost.propTypes = {
    setPosts: PropTypes.func.isRequired,
    setProfiles: PropTypes.func.isRequired,
    profiles: PropTypes.object.isRequired,
}