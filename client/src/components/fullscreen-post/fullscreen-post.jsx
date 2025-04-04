import styles from './fullscreen-post.module.css'
import { memo, useState, useEffect, useContext, useMemo } from 'react'
import { useParams, Link } from 'react-router';
import { AuthContext } from '../../contexts'
import PropTypes from 'prop-types';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import Comment from '../comment/comment';

const FullscreenPost = memo(function FullscreenPost () {
    const { user, socket } = useContext(AuthContext);
    const { postId }  = useParams()
    const [posts, setPosts] = useState({})
    const [loading, setLoading] = useState(false)
    const [loadingError, setLoadingError] = useState(false)
    const post = useMemo(() => posts[postId], [postId, posts])
    const commentsNumber = useMemo(() => post && post.comments.reduce((total, current) => 
        total + 1 + current.comments.length, 0), [post])
    const handlePostClick = async(e) => {
        e.stopPropagation()
        e.preventDefault();
        if (e.currentTarget.dataset.func === 'like') {
            const postId = +e.currentTarget.id;
            try {
                socket.current.emit('post like', postId, (like) => {
                    setPosts(prev => ({...prev, [postId]: {...prev[postId], likes: [like, ...prev[postId].likes], isLiked: true}}))
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
                        setPosts(prev => {
                            const index = prev[postId].likes.findIndex(like => like.authorId === user.id)
                            prev[postId].likes.splice(index, 1)
                            return {...prev, [postId]: {...prev[postId], isLiked: false}};
                        })
                    }
                })
            } catch(err) {
                console.log(err)
            }
        }
    }
    useEffect(() => {
        const fetchPost = async() => {
            setLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/posts/${postId}`, {
                    credentials: 'include'
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                  }
                const response = await request.json();
                console.log(response)
                setPosts((prev) => ({...prev, [response.post.id]: response.post}))
                setLoadingError(false)
            } catch(err) {
                console.log(err)
                setLoadingError(true);
            } finally {
                setLoading(false)
            }
        }
        if(postId) {
            const post = posts[postId];
            if(!post) {
                fetchPost();
            }
        }
    }, [postId, posts])
    if(!post) return;
    return (
        <>
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                <h1>Post</h1>
            </header>
            <div className={styles.container}>
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
                            <button className={styles.likes} onClick={handlePostClick} id={post.id} data-func={post.isLiked ? "unlike" : "like"}>
                                <Heart size={35} fill={post.isLiked ? "red" : null} color={post.isLiked ? null : "white"} />
                                <p>{post.likes.length > 0 ? post.likes.length : ''}</p>
                            </button>
                            <button className={styles.comments} id={post.id} data-func="comment">
                                <MessageCircle size={35} />
                                <p>{commentsNumber > 0 ? commentsNumber : ''}</p>
                            </button>
                        </div>
                    </div>
                </section>
                <AddComment postId={postId} post={post} setPosts={setPosts} />
                <section className={styles.commentsContainer}>
                    {post.comments.map(comment => <Comment key={comment.id} comment={comment} />)}
                </section>
            </div>
        </main>
        </>
    )
})

function AddComment ({post, postId, setPosts}) {
    const [commentTxt, setCommentTxt] = useState('')
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false)
    const createPost = async(e) => {
        e.preventDefault();
        if(!commentTxt) {
            return;
        }
        setLoading(true)
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/comments/post/${postId}/text`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    content: commentTxt,
                    postAuthorId: post.authorId
                })
            })
            const response = await request.json();
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            console.log(response);
            setPosts(prev => ({...prev, [postId]: {...prev[postId], comments: [response.comment, ...prev[postId].comments]}}))
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
            <form onSubmit={createPost}>
                <label htmlFor="post"></label>
                <textarea placeholder="Post your reply" value={commentTxt} onChange={(e) => setCommentTxt(e.target.value)} id="post"></textarea>
                <button>Reply</button>
            </form>
        </section>
    )
}



export default FullscreenPost;



