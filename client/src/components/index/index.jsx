import styles from './index.module.css'
import { useContext, useMemo } from 'react'
import { useOutletContext, Link } from 'react-router'
import Post from '../post/post'
import PropTypes from 'prop-types'
import { AuthContext } from '../../contexts'
import { Image, LoaderCircle } from 'lucide-react';
import SearchUser from '../search-user/search-user';
import { Virtuoso } from 'react-virtuoso'
export default function Index () {
    const { user, containerRef } = useContext(AuthContext);
    const { posts, postsLoading, postsError, setPosts, setCachedUsers, setFullPosts, setCreatingPost } = useOutletContext();
    const postsArray = useMemo(() => Object.values(posts).reverse(), [posts])
    return (
        <main className={styles.main}>
            <SearchUser />
            <AddPost setPosts={setPosts} setCachedUsers={setCachedUsers} setCreatingPost={setCreatingPost} />
            {postsLoading ? 
            <div className={styles.loadingDiv}>
                <LoaderCircle className={styles.loading} size={40} />
            </div> :
            postsError ?
            <div className={styles.loadingDiv}>
                <h1>An Error has occured, please try again later.</h1>
            </div> : postsArray.length > 0 ?
            <Virtuoso
                    increaseViewportBy={{bottom: 200, top: 200}}
                    customScrollParent={containerRef.current}
                    data={postsArray}
                    itemContent={(index, post) => {
                        const isLast =
                            index === postsArray.length - 1 ? true : false;
                        return <Post key={post.id} post={post} setPosts={setPosts} setCachedUsers={setCachedUsers} setFullPosts={setFullPosts} isLast={isLast} />
                    }}
            /> :
            (postsArray.length > 0 && user) ?
            <div className={styles.loadingDiv}>
                <h1>Follow users to see their posts</h1>
            </div> :
            <div className={styles.loadingDiv}>
                <h1>Login to see people post</h1>
            </div>
        }
            <section className={styles.bottom}>
                <Link to='https://github.com/3antozz/Odin-Book'>Github Repo</Link>
                <span> | </span>
                <Link to='https://github.com/3antozz'>Dev Profile</Link>
                <p>© 2025 3antozz</p>
            </section>
        </main>
    )
}


function AddPost ({ setCreatingPost }) {
    const { user } = useContext(AuthContext);
    if(!user) return (
        <section className={styles.happening}>
            <Link to='/login'><img src='/no-profile-pic.jpg' alt='guest profile picture' loading='lazy' /></Link>
            <button className={styles.mind} disabled>Login to post</button>
            <button className={styles.image} disabled><Image color='white' size={30} /></button>
        </section>
    );
    return (
        <section className={styles.happening}>
            <Link to={`/profile/${user.id}`}><img src={user.picture_url || '/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`} loading='lazy' /></Link>
            <button className={styles.mind} onClick={() => setCreatingPost(true)}>What&apos;s on your mind, {user.first_name}?</button>
            <button className={styles.image} onClick={() => setCreatingPost(true)}><Image color='white' size={30} /></button>
        </section>
    )
}

AddPost.propTypes = {
    setCreatingPost: PropTypes.func.isRequired,
}