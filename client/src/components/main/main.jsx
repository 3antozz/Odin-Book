import styles from './main.module.css'
import Sidebar from '../sidebar/sidebar'
import { Outlet } from 'react-router'
import { useState, useEffect, useContext, useMemo, useRef } from 'react'
import { AuthContext } from '../../contexts'
import CreatePost from '../create-post/create-post'
import SearchUser from '../search-user/search-user';
import MostFollowed from '../most-followed/most-followed';
import MostLiked from '../most-liked/most-liked'
export default function Main () {
    const { user, socket, socketOn } = useContext(AuthContext);
    const [posts, setPosts] = useState({})
    const [fullPosts, setFullPosts] = useState({})
    const [profiles, setProfiles] = useState({})
    const [followage, setFollowage] = useState({})
    const [notifications, setNotifications] = useState({})
    const [isFetched, setFetched] = useState(false)
    const [creatingPost, setCreatingPost] = useState(false)
    const [postsLoading, setPostsLoading] = useState(false)
    const [connectedToRooms, setConnectedToRooms] = useState(false)
    const [error, setError] = useState(false)
    const notifsCount = useRef(0)
    const notificationsArray = useMemo(() => Object.values(notifications).reverse().slice(1), [notifications])
    const unseenNotificationsCount = useMemo(() => {
        const length = notificationsArray.filter(notification => !notification.seen).length
        notifsCount.current = length;
        return length
    }, [notificationsArray])
    useEffect(() => {
        const connectToRooms = () => {
            const followingIds = user.following.map((following) => `following${following.followingId}`)
            socket.current.emit('join rooms', followingIds)
            setConnectedToRooms(true)
        }
        if(socketOn && !connectedToRooms) {
            connectToRooms();
        }
    }, [socket, socketOn, connectedToRooms, setConnectedToRooms, user])
    useEffect(() => {
        if(user && !notifications.isSet) {
            const notifs = { isSet: true };
            user.notifications_received.forEach((notification) => notifs[notification.id] = notification)
            setNotifications(notifs)
        }
    }, [user, notifications])
    useEffect(() => {
        if(!socketOn) return;
        const listener = socket.current;
        const addNotification = (notification) => {
            setNotifications(prev => ({...prev, [notification.id]: notification}))
        }
        const addRequest = (senderId) => {
            setProfiles(prev => {
                const isFetched = prev[senderId];
                if(!isFetched) return prev;
                return {...prev, [senderId]: {...prev[senderId], hasRequested: true}}})
        }
        const removeReceivedRequest = (senderId) => {
            setProfiles(prev => {
                const isFetched = prev[senderId];
                if(!isFetched) return prev;
                return {...prev, [senderId]: {...prev[senderId], hasRequested: false}}})
        }
        const removeRequest = (senderId) => {
            setProfiles(prev => {
                const isFetched = prev[senderId];
                if(!isFetched) return prev;
                return {...prev, [senderId]: {...prev[senderId], isPending: false}}})
        }
        const addFollowing = (userId) => {
            setProfiles(prev => {
                const currentUser = prev[user.id]
                const otherUser = prev[userId];
                const copy = {...prev}
                if(otherUser) {
                    copy[userId] = {...prev[userId],_count: {...prev[userId]._count, followers: prev[userId]._count.followers + 1}, isPending: false, isFollowed: true}
                }
                if(currentUser) {
                    copy[user.id] = {...prev[userId],_count: {...prev[userId]._count, following: prev[userId]._count.following + 1}}
                }
                return copy
            })
            setFollowage(prev => {
                const copy = {...prev}
                if(prev[userId]?.followers) {
                    const {followers, ...rest} = copy[userId];
                    copy[userId] = rest;
                }
                if(prev[user.id]?.following) {
                    const {following, ...rest} = copy[user.id];
                    copy[user.id] = rest;
                }
                return copy;
            })
            setFetched(false);
            setConnectedToRooms(false)
        }
        const removeFollowing = (userId) => {
            setProfiles(prev => {
                const currentUser = prev[user.id]
                const otherUser = prev[userId];
                const copy = {...prev}
                if(otherUser) {
                    copy[userId] = {...prev[userId],_count: {...prev[userId]._count, followers: prev[userId]._count.followers - 1}, isPending: false, isFollowed: false}
                }
                if(currentUser) {
                    copy[user.id] = {...prev[userId],_count: {...prev[userId]._count, following: prev[userId]._count.following - 1}}
                }
                return copy
            })
            setFollowage(prev => {
                const copy = {...prev}
                if(prev[userId]?.followers) {
                    const {followers, ...rest} = copy[userId];
                    copy[userId] = rest;
                }
                if(prev[user.id]?.following) {
                    const {following, ...rest} = copy[user.id];
                    copy[user.id] = rest;
                }
                return copy;
            })
            setPosts(prev => {
                return Object.fromEntries(
                    Object.entries(prev).filter(([id, post]) => post.authorId !== userId)
                )
            })
        }
        const removeFollower = (userId) => {
            setProfiles(prev => {
                const currentUser = prev[user.id]
                const otherUser = prev[userId];
                const copy = {...prev}
                if(currentUser) {
                    copy[user.id] = {...prev[user.id], _count: {...prev[user.id]._count, followers: prev[user.id]._count.followers - 1}}
                }
                if(otherUser) {
                    copy[userId] =  {...prev[userId],_count: {...prev[userId]._count, following: prev[userId]._count.following - 1}}
                }
                return copy;
            })
            setFollowage(prev => {
                const copy = {...prev}
                if(prev[user.id]?.followers) {
                    const {followers, ...rest} = copy[user.id];
                    copy[user.id] =  rest;
                }
                if(prev[userId]?.following) {
                    const {following, ...rest} = copy[userId];
                    copy[userId] =  rest;
                }
                return copy;
            })
        }
        const addPostLike = (like) => {
            setFullPosts(prev => {
                if(!prev[like.postId]) {
                    return prev;
                }
                return {...prev, [like.postId]: {...prev[like.postId], likes: [like, ...prev[like.postId].likes]}}
            })
            setPosts(prev => {
                if(!prev[like.postId]) {
                    return prev;
                }
                return {...prev, [like.postId]: {...prev[like.postId], _count: {...prev[like.postId]._count, likes: prev[like.postId]._count.likes + 1}}
            }})
            setProfiles(prev => {
                const profile = prev[like.post.authorId];
                if(!profile) return prev
                const posts = profile.posts.slice();
                const index = posts.findIndex(post => post.id === like.postId);
                posts[index] = {...posts[index], _count: {...posts[index]._count, likes: posts[index]._count.likes + 1}}
                return {...prev, [like.post.authorId]: {...prev[like.post.authorId], posts}}
            })
        }
        const addNewPost = (post) => {
            setPosts(prev => ({...prev, [post.id]: post}))
            setProfiles(prev => {
                const profile = prev[post.authorId];
                if(!profile) return prev;
                return {...prev, [post.authorId]: {...profile, posts: [post, ...profile.posts]}}
            })
        }
        const removePost = (post) => {
            setFullPosts(prev => {
                if(!prev[post.id]) return prev;
                const fullPosts = {...prev};
                delete fullPosts[post.id]
                return fullPosts
            })
            setPosts(prev => {
                if(!prev[post.id]) return prev;
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
        }
        const removePostLike = (like) => {
            setFullPosts(prev => {
                if(!prev[like.postId]) {
                    return prev;
                }
                const index = prev[like.postId].likes.findIndex(like2 => like2.userId === like.userId)
                if(index > -1) {
                    const likes = prev[like.postId].likes.slice().toSpliced(index, 1)
                    return {...prev, [like.postId]: {...prev[like.postId], likes}};
                }
                return prev
            })
            setPosts(prev => {
                if(!prev[like.postId]) {
                    return prev;
                }
                return {...prev, [like.postId]: {...prev[like.postId], _count: {...prev[like.postId]._count, likes: prev[like.postId]._count.likes - 1}}
            }})
            setProfiles(prev => {
                const profile = prev[like.post.authorId];
                if(!profile) return prev
                const posts = profile.posts.slice();
                const index = posts.findIndex(post => post.id === like.postId);
                posts[index] = {...posts[index], _count: {...posts[index]._count, likes: posts[index]._count.likes - 1}}
                return {...prev, [like.post.authorId]: {...prev[like.post.authorId], posts}}
            })
        }
        const addCommentLike = (like) => {
            if(!like.comment.commentOnId) {
                setFullPosts(prev => {
                    const post = prev[like.comment.postId];
                    if(!post) return prev;
                    const commentIndex = post.comments.findIndex(comment => comment.id === like.comment.id)
                    const comments = post.comments.slice();
                    comments[commentIndex] = {
                        ...comments[commentIndex],
                        likes: [like, ...comments[commentIndex].likes],
                      };
                    return {...prev,
                        [like.comment.postId]: {
                            ...post,
                            comments,
                          },
                    }
                })
            } else {
                setFullPosts(prev => {
                    const post = prev[like.comment.postId];
                    if(!post) return prev;
                    const commentIndex = post.comments.findIndex(comment => comment.id === like.comment.commentOnId)
                    const comments = post.comments.slice();
                    const subComments = comments[commentIndex].comments.slice();
                    const subCommentIndex = subComments.findIndex(comment => comment.id === like.comment.id)
                    subComments[subCommentIndex] = {
                        ...subComments[subCommentIndex],
                        likes: [like, ...subComments[subCommentIndex].likes],
                    };
                    comments[commentIndex] = {
                        ...comments[commentIndex],
                        comments: subComments,
                    };
                    return {...prev,
                        [like.comment.postId]: {
                            ...post,
                            comments,
                          },
                    }
                })
            }
        }
        const removeCommentLike = (like) => {
            if(!like.comment.commentOnId) {
                setFullPosts(prev => {
                    const post = prev[like.comment.postId];
                    if(!post) return prev;
                    const commentIndex = post.comments.findIndex(comment => comment.id === like.comment.id)
                    const comments = post.comments.slice();
                    const likeIndex = comments[commentIndex].likes.findIndex(like2 => like2.id === like.id)
                    comments[commentIndex] = {
                        ...comments[commentIndex],
                        likes: comments[commentIndex].likes.toSpliced(likeIndex, 1),
                      };
                    return {...prev, 
                        [like.comment.postId]: {
                            ...post,
                            comments,
                          },
                    }
                })
            } else {
                setFullPosts(prev => {
                    const post = prev[like.comment.postId];
                    if(!post) return prev;
                    const commentIndex = post.comments.findIndex(comment => comment.id === like.comment.commentOnId)
                    const comments = post.comments.slice();
                    const subComments = comments[commentIndex].comments.slice();
                    const subCommentIndex = subComments.findIndex(comment => comment.id === like.comment.id)
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
                        [like.comment.postId]: {
                            ...post,
                            comments,
                          },
                    }
                })
            }
        }
        const addComment = (comment) => {
            const postId = comment.postId;
            if(!comment.commentOnId) {
                setFullPosts(prev => {
                    const post  = prev[postId]
                    if(!post) return prev;
                    return {...prev, [postId]: {...prev[postId], comments: [comment, ...prev[postId].comments]}}
                })
            } else {
                setFullPosts(prev => {
                    const post = prev[postId];
                    if(!post) return prev;
                    const commentIndex = post.comments.findIndex(comment2 => comment2.id === comment.commentOnId)
                    const comments = post.comments.slice();
                    comments[commentIndex] = {
                        ...comments[commentIndex],
                        comments: [comment, ...comments[commentIndex].comments],
                    };
                    return {...prev,
                        [postId]: {
                            ...post,
                            comments,
                          },
                    }
                })
            }
            setPosts(prev => {
                const post = prev[postId];
                if(!post) return prev;
                return {...prev, [postId]: {...post, _count: {...post._count, comments: post._count.comments + 1}}}
            })
            setProfiles(prev => {
                const profile = prev[comment.post.authorId];
                if(!profile) return prev
                const posts = profile.posts.slice();
                const index = posts.findIndex(post => post.id === +postId);
                posts[index] = {...posts[index], _count: {...posts[index]._count, comments: posts[index]._count.comments + 1}}
                return {...prev, [comment.post.authorId]: {...profile, posts}}
            })
        }
        const deleteComment = (comment) => {
            if(!comment.commentOnId) {
                setFullPosts(prev => {
                    const post = prev[comment.postId];
                    if(!post) return prev;
                    const commentIndex = post.comments.findIndex(comment2 => comment2.id === comment.id)
                    const comments = post.comments.slice();
                    comments.splice(commentIndex, 1)
                    return {...prev,
                        [comment.postId]: {
                            ...post,
                            comments,
                          },
                    }
                })
            } else {
                setFullPosts(prev => {
                    const post = prev[comment.postId];
                    if(!post) return prev;
                    const commentIndex = post.comments.findIndex(comment2 => comment2.id === comment.commentOnId)
                    const comments = post.comments.slice();
                    const subComments = comments[commentIndex].comments.slice();
                    const subCommentIndex = subComments.findIndex(comment2 => comment2.id === comment.id)
                    subComments.splice(subCommentIndex, 1)
                    comments[commentIndex] = {
                        ...comments[commentIndex],
                        comments: subComments,
                    };
                    return {...prev,
                        [comment.postId]: {
                            ...post,
                            comments,
                        },
                    }
            })
            }
            setPosts(prev => prev[comment.postId] ? ({...prev, [comment.postId]: {...prev[comment.postId], _count: {...prev[comment.postId]._count, comments: prev[comment.postId]._count.comments - 1}}}) : prev)
            setProfiles(prev => {
                const profile = prev[comment.post.authorId];
                if(!profile) return prev
                const posts = profile.posts.slice();
                const index = posts.findIndex(post => post.id === comment.postId);
                posts[index] = {...posts[index], _count: {...posts[index]._count, comments: posts[index]._count.comments - 1}}
                return {...prev, [comment.post.authorId]: {...prev[comment.post.authorId], posts}}
            })
        }
        listener.on('notification', addNotification);
        listener.on('new request', addRequest);
        listener.on('new following', addFollowing);
        listener.on('removed following', removeFollowing);
        listener.on('unfollowed', removeFollower);
        listener.on('received request canceled', removeReceivedRequest);
        listener.on('request rejected', removeRequest);
        listener.on('new post', addNewPost);
        listener.on('remove post', removePost);
        listener.on('post like', addPostLike);
        listener.on('post unlike', removePostLike);
        listener.on('comment like', addCommentLike);
        listener.on('comment unlike', removeCommentLike);
        listener.on('new comment', addComment);
        listener.on('delete comment', deleteComment);

        return () => {
            if(listener) {
                listener.off();
            }
        };
    }, [socket, socketOn, user])
    useEffect(() => {
        const fetchPosts = async() => {
            setPostsLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/posts/following`, {
                    credentials: 'include'
                })
                const response = await request.json();
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                console.log(response);
                const posts = {};
                response.posts.forEach((post) => posts[post.id] = post)
                setPosts(posts)
                setError(false)
                setFetched(true)
            } catch(err) {
                console.log(err)
                setError(true)
            } finally {
                setPostsLoading(false)
            }
        }
        if(!isFetched && user) {
            fetchPosts();
        }
    }, [isFetched, user])
    return (
        <div className={styles.main}>
            <Sidebar notifsCount={unseenNotificationsCount} setCreatingPost={setCreatingPost} />
            {creatingPost && <CreatePost creatingPost={creatingPost} setCreatingPost={setCreatingPost} setProfiles={setProfiles} setPosts={setPosts}  />}
            <Outlet context={{posts, setPosts, postsLoading, error, fullPosts, setFullPosts, profiles, setProfiles, followage, setFollowage, notifications, notificationsArray, setNotifications, notifsCount, setCreatingPost}} />
            <section className={styles.right}>
                <SearchUser />
                <MostLiked />
                <MostFollowed />
            </section>
        </div>
    )
}