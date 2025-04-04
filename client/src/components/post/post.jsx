import styles from './post.module.css'
import { Link } from 'react-router'
import PropTypes from 'prop-types'
import { Heart, MessageCircle } from 'lucide-react';
export default function Post ({post}) {
    const commentsNumber = post.comments.reduce((total, current) => 
        total + 1 + current.comments.length, 0) 
    return (
        <section className={styles.post}>
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
                    <button className={styles.likes} id={post.id} data-func={post.isLiked ? "unlike" : "like"}>
                        <Heart fill={post.isLiked ? "red" : null} color={post.isLiked ? null : "white"} />
                        <p>{post.likes.length > 0 ? post.likes.length : ''}</p>
                    </button>
                    <button className={styles.comments} id={post.id} data-func="comment">
                        <MessageCircle />
                        <p>{commentsNumber > 0 ? commentsNumber : ''}</p>
                    </button>
                </div>
            </div>
        </section>
    )
}


Post.propTypes = {
    post: PropTypes.object.isRequired
}