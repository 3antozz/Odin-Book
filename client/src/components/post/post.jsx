import styles from './post.module.css'
import { Link } from 'react-router'
import PropTypes from 'prop-types'
import { useContext } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { AuthContext } from '../../contexts'
export default function Post ({post, setPosts}) {
    const { socket } = useContext(AuthContext);
    const commentsNumber = post._count.comments + post.comments.reduce((total, current) => 
        total + current._count.comments, 0) 
        const handlePostClick = async(e) => {
            e.stopPropagation()
            e.preventDefault();
            if (e.currentTarget.dataset.func === 'like') {
                const postId = +e.currentTarget.id;
                try {
                    socket.current.emit('post like', postId, () => {
                        setPosts(prev => ({...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, likes: prev[postId]._count.likes + 1} , isLiked: true}}))
                    })
                } catch(err) {
                    console.log(err)
                }
            }
            if (e.currentTarget.dataset.func === 'unlike') {
                const postId = +e.currentTarget.id;
                try {
                    socket.current.emit('post unlike', postId, (status) => {
                        if(status === true) {
                            setPosts(prev => ({...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, likes: prev[postId]._count.likes - 1} , isLiked: false}}))
                        }
                    })
                } catch(err) {
                    console.log(err)
                }
            }
        }
    return (
        <Link to={`/post/${post.id}`} className={styles.post}>
            <img src={post.picture_url || '/no-profile-pic.jpg'} alt={`${post.author.first_name} ${post.author.last_name} profile picture`} />
            <div className={styles.right}>
                <div className={styles.info}>
                    <p>{post.author.first_name} {post.author.last_name}</p>
                    <p>• {post.createdAt}</p>
                </div>
                <div className={styles.content}>
                    {post.content}
                </div>
                <div className={styles.interactions}>
                    <button className={styles.likes} onClick={handlePostClick} id={post.id} data-func={post.isLiked ? "unlike" : "like"}>
                        <Heart size={35} fill={post.isLiked ? "red" : null} color={post.isLiked ? null : "white"} />
                        <p>{post._count.likes > 0 ? post._count.likes : ''}</p>
                    </button>
                    <button className={styles.comments} onClick={handlePostClick} id={post.id} data-func="comment">
                        <MessageCircle size={35} />
                        <p>{commentsNumber > 0 ? commentsNumber : ''}</p>
                    </button>
                </div>
            </div>
        </Link>
    )
}


Post.propTypes = {
    post: PropTypes.object.isRequired,
    setPosts: PropTypes.func.isRequired,
}