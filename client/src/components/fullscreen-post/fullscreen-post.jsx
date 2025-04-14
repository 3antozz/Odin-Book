import styles from './fullscreen-post.module.css'
import {  useState, useEffect, useContext, useMemo } from 'react'
import { useParams, Link, useOutletContext, useNavigate } from 'react-router';
import { AuthContext } from '../../contexts'
import PropTypes from 'prop-types';
import { ArrowLeft, Heart, MessageCircle, Trash } from 'lucide-react';
import Comment from '../comment/comment';
import Users from '../users-list/users-list'

export default function FullscreenPost () {
    const { user, socket } = useContext(AuthContext);
    const { setPosts, fullPosts, setFullPosts, setProfiles } = useOutletContext();
    const { postId }  = useParams()
    const [loading, setLoading] = useState(false)
    const [loadingError, setLoadingError] = useState(false)
    const [postDeleted, setPostDeleted] = useState(false)
    const [likes, setLikes] = useState(null)
    const navigate = useNavigate()
    const post = useMemo(() => fullPosts[postId], [postId, fullPosts])
    const commentsNumber = useMemo(() => post && post.comments.reduce((total, current) => 
        total + 1 + current.comments.length, 0), [post])
    const handlePostClick = async(e) => {
        e.stopPropagation()
        e.preventDefault();
        if (e.currentTarget.dataset.func === 'like') {
            const postId = +e.currentTarget.id;
            try {
                socket.current.emit('post like', postId, (like) => {
                    setFullPosts(prev => ({...prev, [postId]: {...prev[postId], likes: [like, ...prev[postId].likes], isLiked: true}}))
                    setPosts(prev => {
                        if(!prev[postId]) {
                            return prev;
                        }
                        return {...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, likes: prev[postId]._count.likes + 1}, isLiked: true}
                    }})
                    setProfiles(prev => {
                        const profile = prev[post.authorId];
                        if(!profile) return prev
                        const posts = profile.posts.slice();
                        const index = posts.findIndex(post => post.id === postId);
                        posts[index] = {...posts[index], isLiked: true, _count: {...posts[index]._count, likes: posts[index]._count.likes + 1}}
                        return {...prev, [post.authorId]: {...prev[post.authorId], posts}}
                    })
                })
            } catch(err) {
                console.log(err)
            }
        } else if (e.currentTarget.dataset.func === 'unlike') {
            const postId = +e.currentTarget.id;
            try {
                socket.current.emit('post unlike', postId, (status) => {
                    if(status === true) {
                        setFullPosts(prev => {
                            const index = prev[postId].likes.findIndex(like => like.userId === user.id)
                            if(index > -1) {
                                const likes = prev[postId].likes.slice().toSpliced(index, 1)
                                return {...prev, [postId]: {...prev[postId], likes, isLiked: false}};
                            }
                            return prev
                        })
                        setPosts(prev => {
                            if(!prev[postId]) {
                                return prev;
                            }
                            return {...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, likes: prev[postId]._count.likes - 1} , isLiked: false}
                        }})
                        setProfiles(prev => {
                            const profile = prev[post.authorId];
                            if(!profile) return prev;
                            const posts = profile.posts.slice();
                            const index = posts.findIndex(post => post.id === postId);
                            posts[index] = {...posts[index], isLiked: false, _count: {...posts[index]._count, likes: posts[index]._count.likes - 1}}
                            return {...prev, [post.authorId]: {...prev[post.authorId], posts}}
                        })
                    }
                })
            } catch(err) {
                console.log(err)
            }
        } else if (e.currentTarget.dataset.func === 'delete') {
            const confirm = window.confirm('Are you sure you want to delete this post?')
            if(!confirm) {
                return;
            }
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/posts/${post.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                const response = await request.json();
                console.log(response)
                setPosts(prev => {
                    const fullPosts = {...prev};
                    delete fullPosts[post.id]
                    return fullPosts
                })
                setFullPosts(prev => {
                    const fullPosts = {...prev};
                    delete fullPosts[post.id]
                    return fullPosts
                })
                setPosts(prev => {
                    const posts = {...prev};
                    delete posts[post.id]
                    return posts
                })
                setProfiles(prev => {
                    const profile = prev[post.authorId];
                    if(!profile) return prev;
                    const posts = profile.posts.slice();
                    const index = posts.findIndex(post2 => post2.id === post.id);
                    posts.splice(index, 1)
                    return {...prev, [post.authorId]: {...prev[post.authorId], posts}}
                })
                setPostDeleted(true)
                setLoadingError(false)
                navigate(-1)
            } catch(err) {
                console.log(err)
                setLoadingError(true)
            } finally {
                setLoading(false)
            }
        }
    }
    const handleCommentClick = async(e) => {
        if (e.currentTarget.dataset.func === 'like') {
            const postId = +e.currentTarget.dataset.postid;
            const commentId = +e.currentTarget.id;
            const commentOn = +e.currentTarget.dataset.commenton;
            try {
                socket.current.emit('comment like', commentId, (like) => {
                    if(!commentOn) {
                        setFullPosts(prev => {
                            const post = prev[postId];
                            const commentIndex = post.comments.findIndex(comment => comment.id === commentId)
                            const comments = post.comments.slice();
                            comments[commentIndex] = {
                                ...comments[commentIndex],
                                likes: [like, ...comments[commentIndex].likes],
                                isLiked: true,
                              };
                            return {...prev,
                                [postId]: {
                                    ...post,
                                    comments,
                                  },
                            }
                        })
                    } else {
                        setFullPosts(prev => {
                            const post = prev[postId];
                            const commentIndex = post.comments.findIndex(comment => comment.id === commentOn)
                            const comments = post.comments.slice();
                            const subComments = comments[commentIndex].comments.slice();
                            const subCommentIndex = subComments.findIndex(comment => comment.id === commentId)
                            subComments[subCommentIndex] = {
                                ...subComments[subCommentIndex],
                                likes: [like, ...subComments[subCommentIndex].likes],
                                isLiked: true,
                            };
                            comments[commentIndex] = {
                                ...comments[commentIndex],
                                comments: subComments,
                            };
                            return {...prev,
                                [postId]: {
                                    ...post,
                                    comments,
                                  },
                            }
                        })
                    }
                })
            } catch(err) {
                console.log(err)
            }
        } else if (e.currentTarget.dataset.func === 'unlike') {
            const commentId = +e.currentTarget.id;
            const postId = +e.currentTarget.dataset.postid;
            const commentOn = +e.currentTarget.dataset.commenton;
            try {
                socket.current.emit('comment unlike', commentId, (likeId) => {
                    if(!commentOn) {
                        setFullPosts(prev => {
                            const post = prev[postId];
                            const commentIndex = post.comments.findIndex(comment => comment.id === commentId)
                            const comments = post.comments.slice();
                            const likeIndex = comments[commentIndex].likes.findIndex(like => like.id === likeId)
                            comments[commentIndex] = {
                                ...comments[commentIndex],
                                likes: comments[commentIndex].likes.toSpliced(likeIndex, 1),
                                isLiked: false,
                              };
                            return {...prev, 
                                [postId]: {
                                    ...post,
                                    comments,
                                  },
                            }
                        })
                    } else {
                        setFullPosts(prev => {
                            const post = prev[postId];
                            const commentIndex = post.comments.findIndex(comment => comment.id === commentOn)
                            const comments = post.comments.slice();
                            const subComments = comments[commentIndex].comments.slice();
                            const subCommentIndex = subComments.findIndex(comment => comment.id === commentId)
                            const likeIndex = subComments[subCommentIndex].likes.findIndex(like => like.id === likeId)
                            subComments[subCommentIndex] = {
                                ...subComments[subCommentIndex],
                                likes: subComments[subCommentIndex].likes.toSpliced(likeIndex, 1),
                                isLiked: false,
                            };
                            comments[commentIndex] = {
                                ...comments[commentIndex],
                                comments: subComments,
                            };
                            return {...prev,
                                [postId]: {
                                    ...post,
                                    comments,
                                  },
                            }
                        })
                    }
                })
            } catch(err) {
                console.log(err)
            }
        } else if (e.currentTarget.dataset.func === 'delete') {
            const confirm = window.confirm('Are you sure you want to delete this comment?')
            if(!confirm) {
                return;
            }
            const postId = +e.currentTarget.dataset.postid;
            const commentId = +e.currentTarget.id;
            const commentOn = +e.currentTarget.dataset.commenton;
            setLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                })
                const response = await request.json();
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                console.log(response);
                if(!commentOn) {
                    setFullPosts(prev => {
                        const post = prev[postId];
                        const commentIndex = post.comments.findIndex(comment => comment.id === commentId)
                        const comments = post.comments.slice();
                        comments.splice(commentIndex, 1)
                        return {...prev,
                            [postId]: {
                                ...post,
                                comments,
                              },
                        }
                    })
                } else {
                    setFullPosts(prev => {
                        const post = prev[postId];
                        const commentIndex = post.comments.findIndex(comment => comment.id === commentOn)
                        const comments = post.comments.slice();
                        const subComments = comments[commentIndex].comments.slice();
                        const subCommentIndex = subComments.findIndex(comment => comment.id === commentId)
                        subComments.splice(subCommentIndex, 1)
                        comments[commentIndex] = {
                            ...comments[commentIndex],
                            comments: subComments,
                        };
                        return {...prev,
                            [postId]: {
                                ...post,
                                comments,
                            },
                        }
                })
                }
                setPosts(prev => ({...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, comments: prev[postId]._count.comments - 1} , isLiked: true}}))
                setProfiles(prev => {
                    const profile = prev[post.authorId];
                    if(!profile) return prev
                    const posts = profile.posts.slice();
                    const index = posts.findIndex(post => post.id === +postId);
                    posts[index] = {...posts[index], isLiked: true, _count: {...posts[index]._count, comments: posts[index]._count.comments - 1}}
                    return {...prev, [post.authorId]: {...prev[post.authorId], posts}}
                })
                setLoadingError(false)
            } catch(err) {
                console.log(err)
                setLoadingError(true)
            } finally {
                setLoading(false)
            }
        }
    }
    const showLikes = () => {
        const users = [];
        post.likes.forEach(like => users.push(like.user))
        setLikes(users);
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
                setFullPosts((prev) => ({...prev, [response.post.id]: response.post}))
                setLoadingError(false)
            } catch(err) {
                console.log(err)
                setLoadingError(true);
            } finally {
                setLoading(false)
            }
        }
        if(postId) {
            const post = fullPosts[postId];
            if(!post && !postDeleted) {
                fetchPost();
            }
        }
    }, [postId, fullPosts, postDeleted, setFullPosts])
    if(!post || !user) return;
    return (
        <>
        <Users likes={likes} setLikes={setLikes} />
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                <h1>Post</h1>
            </header>
            <div className={styles.container}>
                <section className={styles.post}>
                <Link to={`/profile/${post.authorId}`}><img src={post.author.picture_url || '/no-profile-pic.jpg'} alt={`${post.author.first_name} ${post.author.last_name} profile picture`} /></Link>
                    <div className={styles.right}>
                        <div className={styles.info}>
                        <Link to={`/profile/${post.authorId}`}><p>{post.author.first_name} {post.author.last_name}</p></Link>
                            <p>• {post.createdAt}</p>
                        </div>
                        <div className={styles.content}>
                            {post.content}
                        </div>
                        <div className={styles.interactions}>
                            <div className={styles.likes}>
                                <button onClick={handlePostClick} id={post.id} data-func={post.isLiked ? "unlike" : "like"}><Heart size={35} fill={post.isLiked ? "red" : null} color={post.isLiked ? null : "white"} /></button>
                                <button disabled={post.likes.length === 0} onClick={showLikes}><p style={{visibility: post.likes.length > 0 ? 'visible' : 'hidden'}}>{post.likes.length}</p></button>
                            </div>
                            <button className={styles.comments} id={post.id} data-func="comment">
                                <MessageCircle size={35} />
                                <p style={{visibility: commentsNumber > 0 ? 'visible' : 'hidden'}}>{commentsNumber}</p>
                            </button>
                            {post.authorId === user.id &&
                            <button className={styles.delete} onClick={handlePostClick} id={post.id} data-func="delete" data-author={post.authorId}>
                                <Trash size={35} />
                            </button>
                            }
                        </div>
                    </div>
                </section>
                <AddComment postId={postId} post={post} setFullPosts={setFullPosts} setPosts={setPosts} setProfiles={setProfiles} />
                <section className={styles.commentsContainer}>
                    {post.comments.map((comment, index) => {
                        let isLast = false;
                        if(index === post.comments.length - 1) {
                            isLast = true;
                        }
                        return <Comment key={comment.id} comment={comment} handleClick={handleCommentClick} isSub={false} setFullPosts={setFullPosts} setPosts={setPosts} isLast={isLast} setLikes={setLikes} />
                        })}
                </section>
            </div>
        </main>
        </>
    )
}

function AddComment ({post, postId, setPosts, setFullPosts, setProfiles}) {
    const [commentTxt, setCommentTxt] = useState('')
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false)
    const createComment = async(e) => {
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
            setFullPosts(prev => ({...prev, [postId]: {...prev[postId], comments: [response.comment, ...prev[postId].comments]}}))
            setPosts(prev => ({...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, comments: prev[postId]._count.comments + 1} , isLiked: true}}))
            setProfiles(prev => {
                const profile = prev[post.authorId];
                if(!profile) return prev
                const posts = profile.posts.slice();
                const index = posts.findIndex(post => post.id === +postId);
                posts[index] = {...posts[index], isLiked: true, _count: {...posts[index]._count, comments: posts[index]._count.comments + 1}}
                return {...prev, [post.authorId]: {...prev[post.authorId], posts}}
            })
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
                <textarea placeholder="Post your reply" value={commentTxt} onChange={(e) => setCommentTxt(e.target.value)} id="post"></textarea>
                <button>Reply</button>
            </form>
        </section>
    )
}

AddComment.propTypes = {
    postId: PropTypes.string.isRequired,
    post: PropTypes.object.isRequired,
    setPosts: PropTypes.func.isRequired,
    setFullPosts: PropTypes.func.isRequired,
    setProfiles: PropTypes.func.isRequired,
}



