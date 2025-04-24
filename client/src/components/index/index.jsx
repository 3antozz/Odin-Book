import styles from './index.module.css'
import { useContext, useMemo } from 'react'
import { useOutletContext } from 'react-router'
import Post from '../post/post'
import PropTypes from 'prop-types'
import { AuthContext } from '../../contexts'
import { Image } from 'lucide-react';
export default function Index () {
    const { posts, setPosts, setProfiles, setFullPosts, setCreatingPost } = useOutletContext();
    const postsArray = useMemo(() => Object.values(posts).reverse(), [posts])
    return (
        <main className={styles.main}>
            <AddPost setPosts={setPosts} setProfiles={setProfiles} setCreatingPost={setCreatingPost} />
            {postsArray.map(post => <Post key={post.id} post={post} setPosts={setPosts} setProfiles={setProfiles} setFullPosts={setFullPosts} />)}
        </main>
    )
}


function AddPost ({ setCreatingPost }) {
    const { user } = useContext(AuthContext);
    if(!user) return;
    return (
        <section className={styles.happening}>
            <img src={user.picture_url || '/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`} />
            <button className={styles.mind} onClick={() => setCreatingPost(true)}>What&apos;s on your mind, {user.first_name}?</button>
            <button className={styles.image} onClick={() => setCreatingPost(true)}><Image color='white' size={30} /></button>
        </section>
    )
}

AddPost.propTypes = {
    setCreatingPost: PropTypes.func.isRequired,
}