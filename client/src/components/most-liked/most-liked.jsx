import styles from './most-liked.module.css'
import { memo, useState, useEffect, useContext } from 'react'
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import { Heart, LoaderCircle } from 'lucide-react';
import { AuthContext } from '../../contexts'

const MostLiked = memo(function CreatePost () {
    const { user } = useContext(AuthContext)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [isFetched, setFetched] = useState(false)
    useEffect(() => {
        const fetchPosts = async() => {
            try {
                setLoading(true)
                const request = await fetch(`${import.meta.env.VITE_API_URL}/posts/popular`, {
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
                setPosts(response.posts);
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
            fetchPosts();
        }
    }, [isFetched])
    return (
        <section className={styles.container}>
            <h3>{user ? 'Popular In Your Following' : 'Popular Public Posts'} </h3>
            {loading ? 
            <div className={styles.loadingDiv}>
                <LoaderCircle className={styles.loading} size={30} />
            </div> :
            error ?
            <div className={styles.loadingDiv}>
                <p>Error loading content</p>
            </div> :
            <ul className={styles.result}>
            {posts.map(p => 
                <li key={p.id} className={styles.member}>
                    <Link to={`/post/${p.id}`}>
                        <img src={p.author.avatar_url || "/no-profile-pic.jpg"} alt={`${p.author.first_name} ${p.author.last_name} profile picture`}/>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.2 }}>
                                {p.content.length > 50 ? p.content.slice(0, 47) + "…" : p.content}
                            </p>
                            <small style={{ color: "#666" }}>
                                {p.author.first_name} {p.author.last_name} • {p._count.likes}{" "}
                                {p._count.likes === 1 ? "like" : "likes"}
                            </small>
                        </div>
                    </Link>
                </li>
            )}
            </ul>
            }
        </section>
    )
})



MostLiked.propTypes = {
}

export default MostLiked;



