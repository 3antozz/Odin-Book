import styles from './main.module.css'
import Sidebar from '../sidebar/sidebar'
import { Outlet } from 'react-router'
import { useState, useEffect, useContext, useMemo, useRef } from 'react'
import { AuthContext } from '../../contexts'
export default function Main () {
    const { user, socket, socketOn } = useContext(AuthContext);
    const [posts, setPosts] = useState({})
    const [fullPosts, setFullPosts] = useState({})
    const [profiles, setProfiles] = useState({})
    const [followage, setFollowage] = useState({})
    const [notifications, setNotifications] = useState({})
    const [isFetched, setFetched] = useState(false)
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
        socket.current.on('notification', addNotification)
        socket.current.on('new request', addRequest)
        socket.current.on('new following', addFollowing)
        socket.current.on('unfollowed', removeFollower)
        socket.current.on('received request canceled', removeReceivedRequest)
        socket.current.on('request rejected', removeRequest)

        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('notification');
                listener.off('new request');
                listener.off('new following');
                listener.off('unfollowed');
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
            <Sidebar notifsCount={unseenNotificationsCount} />
            <Outlet context={{posts, setPosts, postsLoading, error, fullPosts, setFullPosts, profiles, setProfiles, followage, setFollowage, notifications, notificationsArray, setNotifications, notifsCount}} />
        </div>
    )
}