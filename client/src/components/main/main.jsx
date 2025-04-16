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
        if(socketOn && user.following.length > 0 && !connectedToRooms) {
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
        const addNotification = (notification) => {
            console.log(notification);
            setNotifications(prev => ({...prev, [notification.id]: notification}))
        }
        if(socketOn){
            socket.current.on('notification', addNotification)
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('notification');
            }
        };
    }, [setNotifications, socket, socketOn])
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