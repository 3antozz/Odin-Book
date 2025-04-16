import styles from './notifications.module.css'
import { useState, useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useOutletContext, Link } from 'react-router'
import { AuthContext } from '../../contexts'
import { formatDate } from '../../date-format'
import { Heart, MessageSquareMore, User, Circle } from 'lucide-react';
export default function Notifications () {
    const { user, socket } = useContext(AuthContext);
    const { notificationsArray, setNotifications, notifsCount } = useOutletContext();
    const [error, setError] = useState(false)
    useEffect(() => {
        const setSeenNotifications = () => {
            try {
                socket.current.emit('notifications seen', (status) => {
                    if(status === true) {
                        setNotifications(prev => {
                            return Object.fromEntries(
                                Object.entries(prev).map(([id, notification]) => [
                                    id,
                                    {...notification, seen: true}
                                ])
                            )
                        })
                    }
                })
            } catch(err) {
                console.log(err)
            }
        }
        const count = notifsCount.current
        return () => count > 0 && setSeenNotifications()
    }, [notifsCount, setNotifications, socket])
    if(!user || notificationsArray.length === 0) {
        return;
    }
    return (
        <main className={styles.main}>
            <h1>Notifications</h1>
            <ul className={styles.notifications}>
                {notificationsArray.map(notification => <Notification key={notification.id} notification={notification}/>)}
            </ul>
        </main>
    )
}


const Notification = ({notification}) => {
    const type = (notification.type === 'Request_received' || notification.type === 'Request_accepted') ? 'request' : 'post'
    return (
        <Link className={styles.notification} style={{backgroundColor: !notification.seen ? '#2a2a2b' : null}} to={type === 'request' ? `/profile/${notification.actor.id}` : `/post/${notification.postId}`}>
            <div className={styles.left}>
                <img src={notification.actor.picture_url || '/no-profile-pic.jpg'} alt={`${notification.actor.first_name} ${notification.actor.last_name} profile picture`} loading='lazy' />
                {(notification.type === 'Request_received' || notification.type === 'Request_accepted') ? 
                <User size={24} fill='white' style={{backgroundColor: '#4444b0'}} /> : notification.type === 'Like' ?
                <Heart size={24} fill='white' style={{backgroundColor: 'red'}} /> : <MessageSquareMore size={24}  style={{backgroundColor: '#139c13'}} fill='white' />
                }
            </div>
            <div className={styles.right}>
                {notification.type === 'Request_received' && 
                <p>
                    <em>{notification.actor.first_name} {notification.actor.last_name}</em> sent you a follow request.
                </p>}
                {notification.type === 'Request_accepted' && 
                <p>
                    <em>{notification.actor.first_name} {notification.actor.last_name}</em> accepted your follow request.
                </p>}
                {(notification.type === 'Like' && !notification.commentId) && 
                <p>
                    <em>{notification.actor.first_name} {notification.actor.last_name}</em> liked your post.
                </p>}
                {(notification.type === 'Like' && notification.commentId) && 
                <p>
                    <em>{notification.actor.first_name} {notification.actor.last_name}</em> liked your comment.
                </p>}
                {(notification.type === 'Comment' && !notification.commentId) && 
                <p>
                    <em>{notification.actor.first_name} {notification.actor.last_name}</em> commented on your post.
                </p>}
                {(notification.type === 'Comment' && notification.commentId) && 
                <p>
                    <em>{notification.actor.first_name} {notification.actor.last_name}</em> commented on a post you commented on.
                </p>}
                <p className={styles.date}>{formatDate(notification.createdAt)}</p>
            </div>
            {!notification.seen && <Circle size={15} fill='cyan' color='cyan' className={styles.circle} />}
        </Link>
    )
}

Notification.propTypes = {
    notification: PropTypes.object.isRequired,
}