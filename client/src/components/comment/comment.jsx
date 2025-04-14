import styles from './comment.module.css'
import { Link } from 'react-router'
import PropTypes from 'prop-types'
import { useContext, useState, memo } from 'react'
import { AuthContext } from '../../contexts'
import { Heart, MessageCircle, Trash } from 'lucide-react';
const Comment = memo(function Comment ({comment, handleClick, isSub, isLast, setPosts, setFullPosts, setLikes}) {
    const { user, socket } = useContext(AuthContext);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const commentsNumber = comment.comments.length;
    const showLikes = () => {
        const users = [];
        comment.likes.forEach(like => users.push(like.user))
        setLikes(users);
    }
    if(!user) {
        return;
    }
    return (
        <section className={styles.comment} style={{borderBottom: isSub ? null : isLast ? null : "2px solid grey"}}>
            <section className={isSub ? styles.subComment : styles.topComment}>
            <Link to={`/profile/${comment.authorId}`}><img src={comment.author.picture_url || '/no-profile-pic.jpg'} alt={`${comment.author.first_name} ${comment.author.last_name} profile picture`} /></Link>
                <div className={styles.right}>
                    <div className={styles.info}>
                    <Link to={`/profile/${comment.authorId}`}><p>{comment.author.first_name} {comment.author.last_name}</p></Link>
                        <p>• {comment.createdAt}</p>
                    </div>
                    <div className={styles.content}>
                        {comment.content}
                    </div>
                    <div className={styles.interactions}>
                        <div className={styles.likes}>
                            <button onClick={handleClick} id={comment.id} data-func={comment.isLiked ? "unlike" : "like"} data-commenton={comment.commentOnId} data-postid={comment.postId}><Heart size={35} fill={comment.isLiked ? "red" : null} color={comment.isLiked ? null : "white"} /></button>
                            <button disabled={comment.likes.length === 0} onClick={(showLikes)}><p style={{visibility: comment.likes.length > 0 ? 'visible' : 'hidden'}}>{comment.likes.length}</p></button>
                        </div>
                        {!isSub && <button className={styles.comments} onClick={() => setCommentsOpen(prev => !prev)} id={comment.id} data-func="comment" data-commenton={comment.commentOnId} data-postid={comment.postId}>
                            <MessageCircle size={35} color={commentsOpen ? 'red' : 'white'} />
                            <p style={{visibility: commentsNumber > 0 ? 'visible' : 'hidden'}}>{commentsNumber}</p>
                        </button>}
                        {comment.authorId === user.id &&
                        <button className={styles.delete} onClick={handleClick} id={comment.id} data-func="delete" data-commenton={comment.commentOnId} data-postid={comment.postId}>
                            <Trash size={35} />
                        </button>
                        }
                    </div>
                    {commentsOpen && <AddSubComment comment={comment} setPosts={setPosts} setFullPosts={setFullPosts} />}
                </div>
            </section>
            {(commentsOpen && !isSub && comment.comments.length > 0) && comment.comments.map(comment2 => <Comment key={comment2.id} comment={comment2} handleClick={handleClick} isSub={true} setLikes={setLikes}/>)}
        </section>
    )
})

function AddSubComment ({comment, setPosts, setFullPosts}) {
    const [commentTxt, setCommentTxt] = useState('')
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false)
    const postId = comment.postId
    const createComment = async(e) => {
        e.preventDefault();
        if(!commentTxt) {
            return;
        }
        setLoading(true)
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/comments/${comment.id}/text`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    content: commentTxt,
                    postId
                })
            })
            const response = await request.json();
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            console.log(response);
            setFullPosts(prev => {
                const post = prev[postId];
                const commentIndex = post.comments.findIndex(comment2 => comment2.id === comment.id)
                const comments = post.comments.slice();
                comments[commentIndex] = {
                    ...comments[commentIndex],
                    comments: [response.comment, ...comments[commentIndex].comments],
                };
                return {...prev,
                    [postId]: {
                        ...post,
                        comments,
                      },
                }
            })
            setPosts(prev => ({...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, comments: prev[postId]._count.comments + 1} , isLiked: true}}))
            setError(false)
            setCommentTxt('')
        } catch(err) {
            console.log(err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    return (
        <section className={styles.happening}>
            <form onSubmit={createComment}>
                <label htmlFor="post"></label>
                <textarea placeholder={`Reply to ${comment.author.first_name}`} value={commentTxt} onChange={(e) => setCommentTxt(e.target.value)} id="post"></textarea>
                <button>Reply</button>
            </form>
        </section>
    )
}


Comment.propTypes = {
    comment: PropTypes.object.isRequired,
    handleClick: PropTypes.func.isRequired,
    isSub: PropTypes.bool.isRequired,
    isLast: PropTypes.bool.isRequired,
    setPosts: PropTypes.func.isRequired,
    setFullPosts: PropTypes.func.isRequired,
    setLikes: PropTypes.func.isRequired,
}

AddSubComment.propTypes = {
    comment: PropTypes.object.isRequired,
    setPosts: PropTypes.func.isRequired,
    setFullPosts: PropTypes.func.isRequired,
}

export default Comment;