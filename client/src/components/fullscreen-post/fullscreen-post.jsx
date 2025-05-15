import styles from './fullscreen-post.module.css'
import {  useState, useEffect, useContext, useMemo, useRef } from 'react'
import { useParams, Link, useOutletContext, useNavigate, useLocation } from 'react-router';
import { AuthContext } from '../../contexts'
import PropTypes from 'prop-types';
import { ArrowLeft, Heart, MessageCircle, Trash, LoaderCircle, Image as ImageIcon, Send } from 'lucide-react';
import Comment from '../comment/comment';
import Users from '../users-list/users-list'
import Image from '../full-image/image';
import { formatNumber, formatPostDate } from '../../date-format'
import Popup from '../popup/popup'
import { Virtuoso } from 'react-virtuoso'

export default function FullscreenPost () {
    const { user, socket, containerRef } = useContext(AuthContext);
    const { cachedUsers, setPosts, fullPosts, setFullPosts, setCachedUsers } = useOutletContext();
    const { postId }  = useParams()
    const location = useLocation();
    const commentLocation = new URLSearchParams(location.search).get('comment');
    const [loading, setLoading] = useState(false)
    const [postLoading, setPostLoading] = useState(false)
    const [loadingError, setLoadingError] = useState(false)
    const [error, setError] = useState(false)
    const [postDeleted, setPostDeleted] = useState(false)
    const [imageURL, setImageURL] = useState(null)
    const [likes, setLikes] = useState(null)
    const [hasScrolled, setHasScrolled] = useState(false)
    const navigate = useNavigate()
    const post = useMemo(() => fullPosts[postId], [postId, fullPosts])
    const virtuosoRef = useRef(null)
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
                    setCachedUsers(prev => {
                        const profile = prev[post.authorId]?.posts;
                        if(!profile) return prev
                        const posts = profile.slice();
                        const index = posts.findIndex(post => post.id === postId);
                        posts[index] = {...posts[index], isLiked: true, _count: {...posts[index]._count, likes: posts[index]._count.likes + 1}}
                        return {...prev, [post.authorId]: {...prev[post.authorId], posts}}
                    })
                })
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setError(true)
                setTimeout(() => setError(false), 3000)
            }
        } else if (e.currentTarget.dataset.func === 'unlike') {
            const postId = +e.currentTarget.id;
            try {
                socket.current.emit('post unlike', postId, (like) => {
                    if(like) {
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
                        setCachedUsers(prev => {
                            const profile = prev[post.authorId]?.posts;
                            if(!profile) return prev;
                            const posts = profile.slice();
                            const index = posts.findIndex(post => post.id === postId);
                            posts[index] = {...posts[index], isLiked: false, _count: {...posts[index]._count, likes: posts[index]._count.likes - 1}}
                            return {...prev, [post.authorId]: {...prev[post.authorId], posts}}
                        })
                    }
                })
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setError(true)
                setTimeout(() => setError(false), 3000)
            }
        } else if (e.currentTarget.dataset.func === 'delete') {
            const confirm = window.confirm('Are you sure you want to delete this post?')
            if(!confirm) {
                return;
            }
            try {
                setLoading(true)
                const request = await fetch(`${import.meta.env.VITE_API_URL}/posts/${post.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                })
                if(request.status === 401) {
                    window.location.href = '/login';
                }
                if(!request.ok) {
                    const error = new Error('An error has occured, please try refreshing the page')
                    throw error;
                }
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
                setCachedUsers(prev => {
                    const profile = prev[post.authorId]?.posts;
                    if(!profile) return prev;
                    const posts = profile.slice();
                    const index = posts.findIndex(post2 => post2.id === post.id);
                    posts.splice(index, 1)
                    return {...prev, [post.authorId]: {...prev[post.authorId], posts}}
                })
                setPostDeleted(true)
                setError(false)
                navigate(-1)
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setError(true)
                setTimeout(() => setError(false), 3000)
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
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setError(true)
                setTimeout(() => setError(false), 3000)
            }
        } else if (e.currentTarget.dataset.func === 'unlike') {
            const commentId = +e.currentTarget.id;
            const postId = +e.currentTarget.dataset.postid;
            const commentOn = +e.currentTarget.dataset.commenton;
            try {
                socket.current.emit('comment unlike', commentId, (like) => {
                    if(!commentOn) {
                        setFullPosts(prev => {
                            const post = prev[postId];
                            const commentIndex = post.comments.findIndex(comment => comment.id === commentId)
                            const comments = post.comments.slice();
                            const likeIndex = comments[commentIndex].likes.findIndex(like2 => like2.id === like.id)
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
                            const likeIndex = subComments[subCommentIndex].likes.findIndex(like2 => like2.id === like.id)
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
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setError(true)
                setTimeout(() => setError(false), 3000)
            }
        } else if (e.currentTarget.dataset.func === 'delete') {
            const confirm = window.confirm('Are you sure you want to delete this comment?')
            if(!confirm) {
                return;
            }
            const postId = +e.currentTarget.dataset.postid;
            const commentId = +e.currentTarget.id;
            const commentOn = +e.currentTarget.dataset.commenton;
            try {
                setLoading(true)
                const request = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                })
                if(request.status === 401) {
                    window.location.href = '/login';
                }
                if(!request.ok) {
                    const error = new Error('An error has occured, please try refreshing the page')
                    throw error;
                }
                
                if(!commentOn) {
                    setFullPosts(prev => {
                        const post = prev[postId];
                        const commentIndex = post.comments.findIndex(comment => comment.id === commentId)
                        if(commentIndex < -1) {
                            return prev;
                        }
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
                        if(commentIndex < -1) {
                            return prev;
                        }
                        const comments = post.comments.slice();
                        const subComments = comments[commentIndex].comments.slice();
                        const subCommentIndex = subComments.findIndex(comment => comment.id === commentId)
                        if(subCommentIndex === -1) {
                            return prev;
                        }
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
                setPosts(prev => prev[postId] ? ({...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, comments: prev[postId]._count.comments - 1}}}) : null)
                setCachedUsers(prev => {
                    const profile = prev[post.authorId]?.posts;
                    if(!profile) return prev
                    const posts = profile.slice();
                    const index = posts.findIndex(post => post.id === +postId);
                    if(index < -1) {
                        return prev;
                    }
                    posts[index] = {...posts[index], _count: {...posts[index]._count, comments: posts[index]._count.comments - 1}}
                    return {...prev, [post.authorId]: {...prev[post.authorId], posts}}
                })
                setError(false)
            // eslint-disable-next-line no-unused-vars
            } catch(err) {            
                setError(true)
                setTimeout(() => setError(false), 3000)
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
            setPostLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/posts/${postId}`, {
                    credentials: 'include'
                })
                if(request.status === 401) {
                    window.location.href = '/login';
                }
                if(!request.ok) {
                    const error = new Error('An error has occured, please try refreshing the page')
                    throw error;
                }
                const response = await request.json();
                
                setFullPosts((prev) => ({...prev, [response.post.id]: response.post}))
                setLoadingError(false)
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setLoadingError(true);
            } finally {
                setPostLoading(false)
            }
        }
        if(postId) {
            const post = fullPosts[postId];
            if(!post && !postDeleted) {
                fetchPost();
            }
        }
    }, [postId, fullPosts, postDeleted, setFullPosts])
    useEffect(() => {
        if(!virtuosoRef.current) {
            return;
        }
        if (!postLoading && commentLocation && !hasScrolled) {
            const commentIdToIndexMap = Object.fromEntries(
                post.comments.map((comment, index) => [comment.id, index])
                );
            const index = commentIdToIndexMap[commentLocation];
            if (typeof index === "number") {
                setTimeout(() => 
                        virtuosoRef.current.scrollToIndex({
                        index,
                        align: "center",
                        behavior: "smooth",
                }), 500)
                setHasScrolled(true)
            }
        }
    }, [postLoading, commentLocation, post, hasScrolled])
    useEffect(() =>  {
        containerRef.current.scrollTo({top: 0, behavior: 'instant'})
    }, [containerRef])
    return (
        <>
        <Popup borderColor='red' shouldRender={error} close={setError} >
            <p>An error has occured, please try refreshing the page</p>
        </Popup>
        <Image imageURL={imageURL} setImageURL={setImageURL}/>
        <Users likes={likes} setLikes={setLikes} cachedUsers={cachedUsers} />
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                <h1>Post</h1>
            </header>
            {(loadingError || (!postLoading && !post)) && 
            <div className={styles.loadingDiv}>
                <p>Couldn&apos;t Load Content</p>
            </div>
            }
            {postLoading && 
            <div className={styles.loadingDiv}>
                <LoaderCircle className={styles.loading} size={50} />
                <p>This may take a while</p>
            </div>
            }
            <div className={styles.container}>
                <section className={styles.post} style={{display: !post ? 'none' : null}}>
                    {post &&
                    <>
                    <Link to={`/profile/${post.authorId}`}><img src={post.author.picture_url || '/no-profile-pic.jpg'} alt={`${post.author.first_name} ${post.author.last_name} profile picture`} loading='lazy' /></Link>
                    <div className={styles.right}>
                        <div className={styles.info}>
                        <Link to={`/profile/${post.authorId}`}><p>{post.author.first_name} {post.author.last_name}</p></Link>
                            <p>• {formatPostDate(post.createdAt)}</p>
                        </div>
                        <div className={styles.content}>
                            <p>{post.content}</p>
                            {post.picture_url && 
                            <img src={post.picture_url} alt={post.content} loading='lazy' onClick={() => setImageURL(post.picture_url)} role='button' tabIndex={0} />}
                        </div>
                        <div className={styles.interactions}>
                            <div className={styles.likes}>
                                <button onClick={handlePostClick} disabled={!user} id={post.id} data-func={post.isLiked ? "unlike" : "like"}><Heart size={35} fill={post.isLiked ? "red" : null} color={post.isLiked ? null : "white"} /></button>
                                <button disabled={post.likes.length === 0} onClick={showLikes}><p style={{display: post.likes.length > 0 ? 'block' : 'none'}}>{formatNumber(post.likes.length)}</p></button>
                            </div>
                            <button className={styles.comments} disabled={!user} id={post.id} data-func="comment">
                                <MessageCircle size={35} />
                                <p style={{display: commentsNumber > 0 ? 'block' : 'none'}}>{formatNumber(commentsNumber)}</p>
                            </button>
                            {post.authorId === user?.id &&
                            <button className={styles.delete} disabled={loading} onClick={handlePostClick} id={post.id} data-func="delete" data-author={post.authorId}>
                                {loading ? 
                                <LoaderCircle size={40} color='white' className={styles.loading}/> :
                                <Trash size={35} />}
                            </button>
                            }
                        </div>
                    </div>
                    </>
                    }
                </section>
                {post &&
                <AddComment postId={postId} post={post} setFullPosts={setFullPosts} setPosts={setPosts} setCachedUsers={setCachedUsers} />
                }
                {post && 
                <section className={styles.commentsContainer}>
                    <Virtuoso
                        ref={virtuosoRef}
                        customScrollParent={containerRef.current}
                        increaseViewportBy={{bottom: 200, top: 200}}
                        data={post.comments}
                        itemContent={(index, comment) => {
                            const isLast = index === post.comments.length-1 ? true : false;
                            return <Comment key={comment.id} comment={comment} handleClick={handleCommentClick} isSub={false} isLast={isLast} setFullPosts={setFullPosts} setPosts={setPosts} setLikes={setLikes} highlightedComment={commentLocation} setImageURL={setImageURL} />
                        }}
                    />
                </section>
                }
            </div>
        </main>
        </>
    )
}

function AddComment ({post, postId, setPosts, setFullPosts, setCachedUsers}) {
    const { user } = useContext(AuthContext);
    const [commentTxt, setCommentTxt] = useState('')
    const [image, setImage] = useState(null);
    const [error, setError] = useState(false)
    const [uploadError, setUploadError] = useState(false)
    const [isUploading, setUploading] = useState(false)
    const [isOpen, setOpen] = useState(false)
    const fileDivRef = useRef(null);
    const fileClickedRef = useRef(false);
    const requirement = useRef(document.querySelector('#max-size'))
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
        const input = document.querySelector('#image')
        if(input) {
            input.value = '';
        }
    }
    const createComment = async(e) => {
        e.preventDefault();
        if(!commentTxt && !image) {
            return;
        }
        try {
            setOpen(true)
            setUploading(true)
            const form = new FormData();
            let request;
            form.append('postAuthorId', post.authorId)
            if(commentTxt) {
                form.append('content', commentTxt)
            }
            if(image) {
                form.append('image', image)
                request = await fetch(`${import.meta.env.VITE_API_URL}/comments/post/${postId}/image`, {
                    method: 'POST',
                    credentials: 'include',
                    body: form
                })
            } else if(commentTxt && !image) {
                request = await fetch(`${import.meta.env.VITE_API_URL}/comments/post/${postId}/text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        content: commentTxt,
                        postAuthorId: post.authorId
                    })
                })
            }
            if(request.status === 401) {
                window.location.href = '/login';
            }
            if(!request.ok) {
                const error = new Error('An error has occured, please try refreshing the page')
                throw error;
            }
            const response = await request.json();
            
            setFullPosts(prev => ({...prev, [postId]: {...prev[postId], comments: [response.comment, ...prev[postId].comments]}}))
            setPosts(prev => {
                const post = prev[postId];
                if(!post) return prev;
                return {...prev, [postId]: {...post, _count: {...post._count, comments: post._count.comments + 1}}}
            })
            setCachedUsers(prev => {
                const profile = prev[post.authorId]?.posts;
                if(!profile) return prev
                const posts = profile.slice();
                const index = posts.findIndex(post => post.id === +postId);
                posts[index] = {...posts[index], _count: {...posts[index]._count, comments: posts[index]._count.comments + 1}}
                return {...prev, [post.authorId]: {...profile, posts}}
            })
            setError(false)
            setCommentTxt('')
            setOpen(false)
            cancelFile()
        // eslint-disable-next-line no-unused-vars
        } catch(err) {        
            setError(true)
            setTimeout(() => setError(false), 3000)
        } finally {
            setUploading(false)
        }
    }
    const handleInputClick = () => {
        fileClickedRef.current = true;
    };

    const handleBlur = () => {
        setTimeout(() => {
            if (fileClickedRef.current) {
                fileClickedRef.current = false;
                return;
            }
            if (!commentTxt && !image) {
                setOpen(false);
            }
        }, 100);
    };
    useEffect(() => setOpen((prev) => prev ? false : prev), [])
    return (
        <>
        <Popup borderColor='red' shouldRender={error} close={setError} >
            <p>An error has occured, please try refreshing the page</p>
        </Popup>
        <section className={styles.happening} onFocus={() => setOpen(true)} onBlur={handleBlur}>
            <form onSubmit={createComment}>
                <div className={styles.text}>
                    <img src={user?.picture_url || '/no-profile-pic.jpg'} alt={`${user?.first_name} ${user?.last_name} profile picture`} loading='lazy' />
                    <label htmlFor="post"></label>
                    <textarea placeholder={user ? "Comment on the post" : "Login to comment"} disabled={!post || !user || isUploading} value={commentTxt} onChange={(e) => setCommentTxt(e.target.value)} id="post" style={{height: isOpen ? '6rem' : image ? '6rem' : null}}></textarea>
                    {(!isOpen && !image) && <button disabled={!post || !user} type='submit'>
                        <Send className={styles.send} />
                        <p>Reply</p>
                        </button>}
                </div>
                {(isOpen || image) &&
                <div className={styles.fileDiv}>
                    <label htmlFor="image" className={styles.label}>
                    <ImageIcon color='white' size={29} /></label>
                    <div className={styles.file} ref={fileDivRef}>
                        <div>
                            <input type="file" disabled={isUploading} id="image" accept='image/*' onClick={handleInputClick} onChange={handleFileClick} />
                            <button type='button' onClick={cancelFile}><Trash color='white' size={24} /></button>
                        </div>
                    </div>
                    <button type='submit' disabled={isUploading}>{isUploading ? 
                    <LoaderCircle  size={33} color='#2a3040' className={styles.loading}/> : 
                    <>
                    <Send className={styles.send} />
                    <p>Reply</p>
                    </>
                    }
                    </button>
                </div>
                }
                {uploadError ? <p className={styles.fileError}>{uploadError}</p> : <p className={styles.requirement} id='max-size' ref={requirement}>* Max size: 5 MB</p>}
            </form>
        </section>
        </>
    )
}

AddComment.propTypes = {
    postId: PropTypes.string.isRequired,
    post: PropTypes.object.isRequired,
    setPosts: PropTypes.func.isRequired,
    setFullPosts: PropTypes.func.isRequired,
    setCachedUsers: PropTypes.func.isRequired,
}



