import styles from './index.module.css'
import { useContext, useMemo } from 'react'
import { useOutletContext, Link } from 'react-router'
import Post from '../post/post'
import PropTypes from 'prop-types'
import { AuthContext } from '../../contexts'
import { Image, LoaderCircle } from 'lucide-react';
export default function Index () {
    const { user } = useContext(AuthContext);
    const { posts, postsLoading, postsError, setPosts, setProfiles, setFullPosts, setCreatingPost } = useOutletContext();
    const postsArray = useMemo(() => Object.values(posts).reverse(), [posts])
    return (
        <main className={styles.main}>
            <AddPost setPosts={setPosts} setProfiles={setProfiles} setCreatingPost={setCreatingPost} />
            {postsLoading ? 
            <div className={styles.loadingDiv}>
                <LoaderCircle className={styles.loading} size={40} />
            </div> :
            postsError ?
            <div className={styles.loadingDiv}>
                <h1>An Error has occured, please try again later.</h1>
            </div> : postsArray.length > 0 ?
            postsArray.map(post => <Post key={post.id} post={post} setPosts={setPosts} setProfiles={setProfiles} setFullPosts={setFullPosts} />) : (postsArray.length > 0 && user) ?
            <div className={styles.loadingDiv}>
                <h1>Follow users to see their posts</h1>
            </div> :
            <div className={styles.loadingDiv}>
                <h1>Login to see people post</h1>
            </div>
        }
        </main>
    )
}


function AddPost ({ setCreatingPost }) {
    const { user } = useContext(AuthContext);
    if(!user) return (
        <section className={styles.happening}>
            <Link to='/login'><img src='/no-profile-pic.jpg' alt='guest profile picture' /></Link>
            <button className={styles.mind} disabled>Login to post</button>
            <button className={styles.image} disabled><Image color='white' size={30} /></button>
        </section>
    );
    return (
        <section className={styles.happening}>
            <Link to={`/profile/${user.id}`}><img src={user.picture_url || '/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`} /></Link>
            <button className={styles.mind} onClick={() => setCreatingPost(true)}>What&apos;s on your mind, {user.first_name}?</button>
            <button className={styles.image} onClick={() => setCreatingPost(true)}><Image color='white' size={30} /></button>
        </section>
    )
}

AddPost.propTypes = {
    setCreatingPost: PropTypes.func.isRequired,
}