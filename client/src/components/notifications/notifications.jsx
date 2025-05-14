import styles from './notifications.module.css'
import { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useOutletContext, Link, Navigate } from 'react-router'
import { AuthContext } from '../../contexts'
import { formatPostDate } from '../../date-format'
import { ArrowLeft, Heart, MessageSquareMore, User, Circle } from 'lucide-react';
export default function Notifications () {
    const { user, socket } = useContext(AuthContext);
    const { notificationsArray, setNotifications, notifsCount } = useOutletContext();
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
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                console.log('Error')
            }
        }
        const count = notifsCount.current
        return () => count > 0 && setSeenNotifications()
    }, [notifsCount, setNotifications, socket])
    if(!user) {
        return <Navigate to='/login' replace />
    }
    return (
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                <h1>Notifications</h1>
            </header>
            <ul className={styles.notifications}>
                {
                notificationsArray.length === 0 ?
                <div className={styles.noNotifs}>
                    <p>No notifications yet</p>
                </div> :
                notificationsArray.map(notification => <Notification key={notification.id} userId={user.id} notification={notification}/>)
                }
            </ul>
        </main>
    )
}


const Notification = ({notification, userId}) => {
    const type = (notification.type === 'Request_received' || notification.type === 'Request_accepted') ? 'request' : ((notification.type === 'Like' || notification.type === 'Comment' || notification.type === 'Comment_Reply') && notification.commentId) ? 'comment' : 'post';
    return (
        <Link className={styles.notification} style={{backgroundColor: !notification.seen ? '#2a2a2b' : null}} to={type === 'request' ? `/profile/${notification.actor.id}` : type === 'comment' ? `/post/${notification.postId}?comment=${notification.commentId}` : `/post/${notification.postId}`}>
            <div className={styles.left}>
                <img src={notification.actor.picture_url || '/no-profile-pic.jpg'} alt={`${notification.actor.first_name} ${notification.actor.last_name} profile picture`} loading='lazy' />
                {(notification.type === 'Request_received' || notification.type === 'Request_accepted') ? 
                <User size={24} fill='white' style={{backgroundColor: 'rgb(90 93 255)'}} /> : notification.type === 'Like' ?
                <Heart size={24} fill='white' style={{backgroundColor: 'red'}} /> : <MessageSquareMore size={24} style={{backgroundColor: 'rgb(14 176 14)'}} fill='white' />
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
                {(notification.type === 'Comment' && notification.commentId && notification.postAuthorId === userId) && 
                <p>
                    <em>{notification.actor.first_name} {notification.actor.last_name}</em> replied to a comment on your post.
                </p>}
                {(notification.type === 'Comment' && notification.commentId && notification.postAuthorId !== userId) && 
                <p>
                    <em>{notification.actor.first_name} {notification.actor.last_name}</em> replied to a comment you commented on.
                </p>}
                {(notification.type === 'Comment_Reply') && 
                <p>
                    <em>{notification.actor.first_name} {notification.actor.last_name}</em> replied to your comment.
                </p>}
                <p className={styles.date}>{formatPostDate(notification.createdAt)}</p>
            </div>
            {!notification.seen && <Circle size={15} fill='cyan' color='cyan' className={styles.circle} />}
        </Link>
    )
}

Notification.propTypes = {
    notification: PropTypes.object.isRequired,
    userId: PropTypes.number.isRequired,
}