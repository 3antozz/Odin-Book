import styles from './comment.module.css'
import { Link } from 'react-router'
import PropTypes from 'prop-types'
import { useContext } from 'react'
import { AuthContext } from '../../contexts'
import { Heart, MessageCircle } from 'lucide-react';
export default function Comment ({comment, handleCommentClick}) {
    const { socket } = useContext(AuthContext);
    const commentsNumber = comment.comments.length;
    return (
        <section to={`/comment/${comment.id}`} className={styles.comment}>
            <img src={comment.author.picture_url || '/no-profile-pic.jpg'} alt={`${comment.author.first_name} ${comment.author.last_name} profile picture`} />
            <div className={styles.right}>
                <div className={styles.info}>
                    <p>{comment.author.first_name} {comment.author.last_name}</p>
                    <p>• {comment.createdAt}</p>
                </div>
                <div className={styles.content}>
                    {comment.content}
                </div>
                <div className={styles.interactions}>
                    <button className={styles.likes} onClick={handleCommentClick} id={comment.id} data-func={comment.isLiked ? "unlike" : "like"}>
                        <Heart size={35} fill={comment.isLiked ? "red" : null} color={comment.isLiked ? null : "white"} />
                        <p>{comment.likes.length > 0 ? comment.likes.length : ''}</p>
                    </button>
                    <button className={styles.comments} onClick={handleCommentClick} id={comment.id} data-func="comment">
                        <MessageCircle size={35} />
                        <p>{commentsNumber > 0 ? commentsNumber : ''}</p>
                    </button>
                </div>
            </div>
        </section>
    )
}


Comment.propTypes = {
    comment: PropTypes.object.isRequired,
}