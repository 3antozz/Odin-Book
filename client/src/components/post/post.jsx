import styles from './post.module.css'
import { Link, useNavigate } from 'react-router'
import PropTypes from 'prop-types'
import { useContext, useState, memo } from 'react';
import { Heart, MessageCircle, Trash, LoaderCircle} from 'lucide-react';
import { AuthContext } from '../../contexts'
import { formatNumber } from '../../date-format'
import Popup from '../popup/popup'
const Post = memo(function Post ({post, setPosts, setProfiles, setFullPosts}) {
    const { user, socket } = useContext(AuthContext);
    const commentsNumber = post._count.comments;
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const handlePostClick = async(e) => {
        e.stopPropagation()
        e.preventDefault();
        if (e.currentTarget.dataset.func === 'like') {
            const postId = +e.currentTarget.id;
            const profileId = +e.currentTarget.dataset.author;
            try {
                socket.current.emit('post like', postId, (like) => {
                    setPosts(prev => {
                        if(!prev[postId]) {
                            return prev;
                        }
                        return {...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, likes: prev[postId]._count.likes + 1}, isLiked: true}
                    }})
                    setProfiles(prev => {
                        const profile = prev[profileId];
                        if(!profile) return prev
                        const posts = profile.posts.slice();
                        const index = posts.findIndex(post => post.id === postId);
                        posts[index] = {...posts[index], isLiked: true, _count: {...posts[index]._count, likes: posts[index]._count.likes + 1}}
                        return {...prev, [profileId]: {...prev[profileId], posts}}
                    })
                    setFullPosts(prev => {
                        if(!prev[postId]) return prev;
                        return {...prev, [postId]: {...prev[postId], likes: [like, ...prev[postId].likes], isLiked: true}}
                    })
                })
            } catch(err) {
                console.log(err)
            }
        } else if (e.currentTarget.dataset.func === 'unlike') {
            const postId = +e.currentTarget.id;
            const profileId = +e.currentTarget.dataset.author;
            try {
                socket.current.emit('post unlike', postId, (like) => {
                    if(like) {
                        setPosts(prev => {
                            if(!prev[postId]) {
                                return prev;
                            }
                            return {...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, likes: prev[postId]._count.likes - 1} , isLiked: false}
                        }})
                        setProfiles(prev => {
                            const profile = prev[profileId];
                            if(!profile) return prev;
                            const posts = profile.posts.slice();
                            const index = posts.findIndex(post => post.id === postId);
                            posts[index] = {...posts[index], isLiked: false, _count: {...posts[index]._count, likes: posts[index]._count.likes - 1}}
                            return {...prev, [profileId]: {...prev[profileId], posts}}
                        })
                        setFullPosts(prev => {
                            const post = prev[postId];
                            if(!post) return prev;
                            const index = prev[postId].likes.findIndex(like => like.userId === user.id)
                            if(index > -1) {
                                const likes = prev[postId].likes.slice().toSpliced(index, 1)
                                return {...prev, [postId]: {...prev[postId], likes, isLiked: false}};
                            }
                            return prev
                        })
                    }
                })
            } catch(err) {
                console.log(err)
            }
        } else if (e.currentTarget.dataset.func === 'comment') {
            const postId = e.currentTarget.id;
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
              return;
            }
            navigate(`/post/${postId}`)
        } else if (e.currentTarget.dataset.func === 'delete') {
            const profileId = +e.currentTarget.dataset.author;
            const postId = e.currentTarget.id;
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
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                const response = await request.json();
                console.log(response)
                setPosts(prev => {
                    const posts = {...prev};
                    delete posts[post.id]
                    return posts
                })
                setProfiles(prev => {
                    const profile = prev[profileId];
                    if(!profile) return prev;
                    const posts = profile.posts.slice();
                    const index = posts.findIndex(post2 => post2.id === post.id);
                    posts.splice(index, 1)
                    return {...prev, [profileId]: {...prev[profileId], posts}}
                })
                setFullPosts(prev => {
                    if(!prev[postId]) return prev;
                    const fullPosts = {...prev};
                    delete fullPosts[post.id]
                    return fullPosts
                })
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true)
                setTimeout(() => setError(false), 3000)
            } finally {
                setLoading(false)
            }
        }
    }
    return (
        <>
        <Popup borderColor='red' shouldRender={error} close={setError} >
            <p>An error has occured, please try again later</p>
        </Popup>
        <article className={styles.post} role="button" onClick={handlePostClick} tabIndex={0} data-func='comment' id={post.id}>
            <Link to={`/profile/${post.authorId}`}
            onClick={(e) => e.stopPropagation()}><img src={post.author.picture_url || '/no-profile-pic.jpg'} alt={`${post.author.first_name} ${post.author.last_name} profile picture`} loading='lazy' /></Link>
            <div className={styles.right}>
                <div className={styles.info}>
                    <Link to={`/profile/${post.authorId}`} onClick={(e) => e.stopPropagation()
                }><p>{post.author.first_name} {post.author.last_name}</p></Link>
                    <p>• {post.createdAt}</p>
                </div>
                <div className={styles.content}>
                    <p>{post.content}</p>
                    {post.picture_url && 
                    <img src={post.picture_url} alt={post.content} loading='lazy' />}
                </div>
                 <div className={styles.interactions}>
                    <button className={styles.likes} disabled={!user || loading} onClick={handlePostClick} id={post.id} data-func={post.isLiked ? "unlike" : "like"} data-author={post.authorId}>
                        <Heart size={35} fill={post.isLiked ? "red" : null} color={post.isLiked ? null : "white"} />
                        <p style={{display: post._count.likes > 0 ? 'block' : 'none'}}>{formatNumber(post._count.likes)}</p>
                    </button>
                    <button className={styles.comments} disabled={loading} onClick={handlePostClick} id={post.id} data-func="comment">
                        <MessageCircle size={35} />
                        <p style={{display: commentsNumber > 0 ? 'block' : 'none'}}>{formatNumber(commentsNumber)}</p>
                    </button>
                    {post.authorId === user?.id &&
                        <button className={styles.delete} disabled={loading} onClick={handlePostClick} id={post.id} data-func="delete" data-author={post.authorId}>
                            {loading ? 
                            <LoaderCircle size={35} color='white' className={styles.loading}/> :
                            <Trash size={35} />}
                        </button>
                    }
                </div>
            </div>
        </article>
        </>
    )
})


Post.propTypes = {
    post: PropTypes.object.isRequired,
    setPosts: PropTypes.func.isRequired,
    setProfiles: PropTypes.func.isRequired,
    setFullPosts: PropTypes.func.isRequired,
}

export default Post;