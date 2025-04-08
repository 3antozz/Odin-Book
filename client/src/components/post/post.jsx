import styles from './post.module.css'
import { Link, useNavigate } from 'react-router'
import PropTypes from 'prop-types'
import { useContext, useState } from 'react';
import { Heart, MessageCircle, Trash} from 'lucide-react';
import { AuthContext } from '../../contexts'
export default function Post ({post, setPosts, setProfile = false}) {
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
                socket.current.emit('post like', postId, () => {
                    setPosts(prev => {
                        if(!prev[postId]) {
                            return prev;
                        }
                        return {...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, likes: prev[postId]._count.likes + 1}, isLiked: true}
                    }})
                    if(setProfile) {
                        setProfile(prev => {
                            const profile = prev[profileId];
                            const posts = profile.posts.slice();
                            const index = posts.findIndex(post => post.id === postId);
                            posts[index] = {...posts[index], isLiked: true, _count: {...posts[index]._count, likes: posts[index]._count.likes + 1}}
                            return {...prev, [profileId]: {...prev[profileId], posts}}
                        })
                    }
                })
            } catch(err) {
                console.log(err)
            }
        }
        if (e.currentTarget.dataset.func === 'unlike') {
            const postId = +e.currentTarget.id;
            const profileId = +e.currentTarget.dataset.author;
            try {
                socket.current.emit('post unlike', postId, (status) => {
                    if(status === true) {
                        setPosts(prev => {
                            if(!prev[postId]) {
                                return prev;
                            }
                            return {...prev, [postId]: {...prev[postId], _count: {...prev[postId]._count, likes: prev[postId]._count.likes - 1} , isLiked: false}
                        }})
                        if(setProfile) {
                            setProfile(prev => {
                                const profile = prev[profileId];
                                const posts = profile.posts.slice();
                                const index = posts.findIndex(post => post.id === postId);
                                posts[index] = {...posts[index], isLiked: false, _count: {...posts[index]._count, likes: posts[index]._count.likes - 1}}
                                return {...prev, [profileId]: {...prev[profileId], posts}}
                            })
                        }
                    }
                })
            } catch(err) {
                console.log(err)
            }
        }
        if (e.currentTarget.dataset.func === 'comment') {
            const postId = e.currentTarget.id;
            navigate(`/post/${postId}`)
        }

        if (e.currentTarget.dataset.func === 'delete') {
            const profileId = +e.currentTarget.dataset.author;
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
                    const posts = {...prev};
                    delete posts[post.id]
                    return posts
                })
                if(setProfile) {
                    setProfile(prev => {
                        const profile = prev[profileId];
                        const posts = profile.posts.slice();
                        const index = posts.findIndex(post2 => post2.id === post.id);
                        posts.splice(index, 1)
                        return {...prev, [profileId]: {...prev[profileId], posts}}
                    })
                }
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }
    }
    return (
        <article className={styles.post} role="button" onClick={handlePostClick} tabIndex={0} data-func='comment' id={post.id}>
            <Link to={`/profile/${post.authorId}`}><img src={post.picture_url || '/no-profile-pic.jpg'} alt={`${post.author.first_name} ${post.author.last_name} profile picture`} /></Link>
            <div className={styles.right}>
                <div className={styles.info}>
                    <Link to={`/profile/${post.authorId}`}><p>{post.author.first_name} {post.author.last_name}</p></Link>
                    <p>• {post.createdAt}</p>
                </div>
                <div className={styles.content}>
                    {post.content}
                </div>
                <div className={styles.interactions}>
                    <button className={styles.likes} onClick={handlePostClick} id={post.id} data-func={post.isLiked ? "unlike" : "like"} data-author={post.authorId}>
                        <Heart size={35} fill={post.isLiked ? "red" : null} color={post.isLiked ? null : "white"} />
                        <p style={{visibility: post._count.likes > 0 ? 'visible' : 'hidden'}}>{post._count.likes}</p>
                    </button>
                    <button className={styles.comments} onClick={handlePostClick} id={post.id} data-func="comment">
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
        </article>
    )
}


Post.propTypes = {
    post: PropTypes.object.isRequired,
    setPosts: PropTypes.func.isRequired,
}