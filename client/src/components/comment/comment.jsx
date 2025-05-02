import styles from './comment.module.css'
import { Link } from 'react-router'
import PropTypes from 'prop-types'
import { useContext, useState, memo, useRef } from 'react'
import { AuthContext } from '../../contexts'
import { Heart, MessageCircle, Trash, Image as ImageIcon, LoaderCircle } from 'lucide-react';
import Image from '../full-image/image';
const Comment = memo(function Comment ({comment, handleClick, isSub, isLast, setPosts, setFullPosts, setLikes, setImageURL, highlightedComment}) {
    const { user } = useContext(AuthContext);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const commentsNumber = comment.comments.length;
    const showLikes = () => {
        const users = [];
        comment.likes.forEach(like => users.push(like.user))
        setLikes(users);
    }
    return (
        <section id={`comment-${comment.id}`} className={`${styles.comment} ${comment.id == highlightedComment ? styles.highlighted : ''}`} style={{borderBottom: isSub ? null : isLast ? null : "2px solid grey"}}>
            <section className={isSub ? styles.subComment : styles.topComment}>
            <Link to={`/profile/${comment.authorId}`}><img src={comment.author.picture_url || '/no-profile-pic.jpg'} alt={`${comment.author.first_name} ${comment.author.last_name} profile picture`} loading='lazy' /></Link>
                <div className={styles.right}>
                    <div className={styles.info}>
                    <Link to={`/profile/${comment.authorId}`}><p>{comment.author.first_name} {comment.author.last_name}</p></Link>
                        <p>• {comment.createdAt}</p>
                    </div>
                    <div className={styles.content}>
                        <p>{comment.content}</p>
                        {comment.picture_url && 
                        <img src={comment.picture_url} alt={comment.content} loading='lazy' onClick={() => setImageURL(comment.picture_url)} role='button' tabIndex={0} />}
                    </div> 
                    <div className={styles.interactions}>
                        <div className={styles.likes}>
                            <button onClick={handleClick} disabled={!user} id={comment.id} data-func={comment.isLiked ? "unlike" : "like"} data-commenton={comment.commentOnId} data-postid={comment.postId}><Heart size={35} fill={comment.isLiked ? "red" : null} color={comment.isLiked ? null : "white"} /></button>
                            <button disabled={comment.likes.length === 0} onClick={(showLikes)}><p style={{display: comment.likes.length > 0 ? 'block' : 'none'}}>{comment.likes.length}</p></button>
                        </div>
                        {!isSub && <button className={styles.comments} onClick={() => setCommentsOpen(prev => !prev)} id={comment.id} data-func="comment" data-commenton={comment.commentOnId} data-postid={comment.postId}>
                            <MessageCircle size={35} color={commentsOpen ? 'red' : 'white'} />
                            <p style={{display: commentsNumber > 0 ? 'block' : 'none'}}>{commentsNumber}</p>
                        </button>}
                        {(comment.authorId === user?.id || comment.post.authorId === user?.id) &&
                        <button className={styles.delete} disabled={!user} onClick={handleClick} id={comment.id} data-func="delete" data-commenton={comment.commentOnId} data-postid={comment.postId}>
                            <Trash size={35} />
                        </button>
                        }
                    </div>
                    {commentsOpen && <AddSubComment comment={comment} setPosts={setPosts} setFullPosts={setFullPosts} />}
                </div>
            </section>
            {(commentsOpen && !isSub && comment.comments.length > 0) && comment.comments.map(comment2 => <Comment key={comment2.id} comment={comment2} handleClick={handleClick} isSub={true} setLikes={setLikes} setImageURL={setImageURL}/>)}
        </section>
    )
})

function AddSubComment ({comment, setPosts, setFullPosts}) {
        const { user } = useContext(AuthContext);
    const [commentTxt, setCommentTxt] = useState('')
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false)
    const [uploadError, setUploadError] = useState(false)
    const [isUploading, setUploading] = useState(false)
    const [isOpen, setOpen] = useState(false)
    const fileDivRef = useRef(null);
    const requirement = useRef(document.querySelector('#max-size2'))
    const postId = comment.postId;
    const handleFileClick = (e) => {
        const file = e.target.files[0];
        if(file) {
            setImage(e.target.files[0])
            if(fileDivRef.current) {
                fileDivRef.current.style.display = 'flex'
                requirement.current.style.display = 'block'
            }
        } else {
            setImage(null)
            setUploadError(false)
            if(fileDivRef.current) {
                fileDivRef.current.style.display = 'none'
                requirement.current.style.display = 'none'
            }
        }
    }
    const cancelFile = () => {
        setImage(null);
        setUploadError(false);
        if(fileDivRef.current) {
            fileDivRef.current.style.display = 'none'
            requirement.current.style.display = 'none'
        }
        const input = document.querySelector('#image2')
        input.value = '';
    }
    const createComment = async(e) => {
        e.preventDefault();
        if(!commentTxt && !image) {
            return;
        }
        setLoading(true)
        try {
            const form = new FormData();
            let request;
            form.append('postId', postId)
            if(commentTxt) {
                form.append('content', commentTxt)
            }
            if(image) {
                form.append('image', image)
                request = await fetch(`${import.meta.env.VITE_API_URL}/comments/${comment.id}/image`, {
                    method: 'POST',
                    credentials: 'include',
                    body: form
                })
            } else if (commentTxt && !image) {
                request = await fetch(`${import.meta.env.VITE_API_URL}/comments/${comment.id}/text`, {
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
            }
            const response = await request.json();
            if(request.status === 401) {
                window.location.href = '/login';
            }
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
            setPosts(prev => prev[postId] ? ({...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, comments: prev[postId]._count.comments + 1}}}) : prev);
            setError(false);
            setCommentTxt('');
            cancelFile();
            setOpen(false)
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
                <div className={styles.text}>
                    <img src={user?.picture_url || '/no-profile-pic.jpg'} alt={`${user?.first_name} ${user?.last_name} profile picture`} />
                    <label htmlFor="post"></label>
                    <textarea placeholder={user ? `Reply to ${comment.author.first_name}` : 'Login to comment'} disabled={!user} value={commentTxt} onChange={(e) => setCommentTxt(e.target.value)} id="post" onClick={() => setOpen(true)} style={{height: isOpen ? '3.5rem' : null}}></textarea>
                    {!isOpen && <button disabled={!user} type='button'>Reply</button>}
                </div>
                <div className={styles.fileDiv}>
                   {isOpen && (<label htmlFor="image2" disabled={isUploading} className={styles.label}>{!isUploading ? <ImageIcon color='white' size={29} /> : <LoaderCircle  size={40} color='white' className={styles.loading}/>}</label>)}
                    <div className={styles.file} ref={fileDivRef}>
                        <div>
                            <input type="file" id="image2" accept='image/*' onChange={handleFileClick} />
                            <button onClick={cancelFile}><Trash color='white' size={24} /></button>
                        </div>
                    </div>
                    {isOpen && <button type='submit'>Reply</button>}
                </div>
                {uploadError ? <p className={styles.fileError}>{uploadError}</p> : <p className={styles.requirement} id='max-size2' ref={requirement}>* Max size: 5 MB</p>}
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
    highlightedComment: PropTypes.string,
    setImageURL: PropTypes.func.isRequired,
}

AddSubComment.propTypes = {
    comment: PropTypes.object.isRequired,
    setPosts: PropTypes.func.isRequired,
    setFullPosts: PropTypes.func.isRequired,
}

export default Comment;