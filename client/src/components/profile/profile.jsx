import styles from './profile.module.css'
import { useState, useContext, useEffect, useMemo } from 'react'
import { useOutletContext, useParams, Link } from 'react-router'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { AuthContext } from '../../contexts'
import Post from '../post/post'
export default function Profile () {
    const { user, socket } = useContext(AuthContext);
    const { userId }  = useParams();
    const { setPosts, profiles, setProfiles } = useOutletContext();
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const profile = useMemo(() => profiles[userId], [userId, profiles])
    const handleFollowage = async(e) => {
        if(e.currentTarget.dataset.func === 'unfollow') {
            const confirm = window.confirm(`Are you sure you want to unfollow ${profile.first_name} ?`)
            if(!confirm) {
                return;
            }
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/unfollow/${profile.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                const response = await request.json();
                console.log(response)
                setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], isFollowed: false, _count: {...prev[profile.id]._count, followers: prev[profile.id]._count.followers - 1}}}))
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true)
            } finally {
                setLoading(false)
            }
        } else if(e.currentTarget.dataset.func === 'follow') {
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/send/${profile.id}`, {
                    method: 'POST',
                    credentials: 'include',
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                const response = await request.json();
                console.log(response)
                setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], isPending: true}}))
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true)
            } finally {
                setLoading(false)
            }
        } else if(e.currentTarget.dataset.func === 'cancel') {
            const confirm = window.confirm(`Are you sure you want to cancel the request ?`)
            if(!confirm) {
                return;
            }
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/cancel-request/${profile.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                const response = await request.json();
                console.log(response)
                setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], isPending: false, isFollowed: false}}))
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }
    }
    const acceptRequest = async() => {
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/accept/${profile.id}`, {
                method: 'POST',
                credentials: 'include',
            })
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            const response = await request.json();
            console.log(response)
            setProfiles(prev => {
                const currentUserProfile = prev[user.id];
                if(currentUserProfile) {
                    return {...prev,
                        [profile.id]: {...prev[profile.id], hasRequested: false, _count: {...prev[profile.id]._count, following: prev[profile.id]._count.following + 1}},
                        [user.id]: {...prev[user.id], _count: {...prev[user.id]._count, followers: prev[user.id]._count.followers + 1}}
                    }
                }
                return {...prev, [profile.id]: {...prev[profile.id], hasRequested: false, _count: {...prev[profile.id]._count, following: prev[profile.id]._count.following + 1}}
            }})
            setError(false)
        } catch(err) {
            console.log(err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    const cancelRequest = async() => {
        const confirm = window.confirm(`Are you sure you want to cancel the request ?`)
        if(!confirm) {
            return;
        }
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/reject/${profile.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            const response = await request.json();
            console.log(response)
            setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], hasRequested: false}}))
            setError(false)
        } catch(err) {
            console.log(err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        const fetchProfile = async() => {
            setLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
                    credentials: 'include'
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                  }
                const response = await request.json();
                console.log(response)
                setProfiles((prev) => ({...prev, [response.profile.id]: response.profile}))
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true);
            } finally {
                setLoading(false)
            }
        }
        if(userId) {
            const profile = profiles[userId];
            if(!profile) {
                fetchProfile();
            }
        }
    }, [userId, profiles, setProfiles])
    if(!profile || !user) {
        return;
    }
    return (
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                <h1>{profile.first_name}&apos;s Profile</h1>
            </header>
            <div className={styles.container}>
                    <section className={styles.info}>
                    {profile.hasRequested && <section className={styles.request}>
                        <div>
                            <p><em>{profile.first_name} has requested to follow you</em></p>
                            <div className={styles.buttons}>
                                <button onClick={acceptRequest}>Accept</button>
                                <button onClick={cancelRequest}>Cancel</button>
                            </div>
                        </div>
                    </section>}
                    <div className={styles.left}>
                        <img src={profile.picture_url || '/no-profile-pic.jpg'} alt={`${profile.first_name} ${profile.last_name} profile picture`} />
                    </div>
                    <div className={styles.right}>
                        <div className={styles.top}>
                            <p className={styles.name}>{profile.first_name} {profile.last_name}</p>
                            {profile.id !== user.id ? <button data-func={profile.isFollowed ? 'unfollow' : profile.isPending ? 'cancel' : 'follow'} onClick={handleFollowage} style={{backgroundColor: profile.isFollowed ? 'red' : profile.isPending ? '#181818' : null, color: profile.isFollowed || profile.isPending ? 'inherit' : 'black'}}>{profile.isFollowed ? 'Unfollow' : profile.isPending ? 'Pending' : 'Follow'}</button> :
                            <button style={{color: 'black'}}>Edit Profile</button>}
                        </div>
                        <p className={styles.bio}>{profile.bio}</p>
                        <div className={styles.followage}>
                            <Link to={'/users'}><em>{profile._count.following}</em> Following</Link>
                            <Link to={'/users'}><em>{profile._count.followers}</em> Followers</Link>
                            <p><em>{profile.posts.length}</em> Posts</p>
                        </div>
                        <div className={styles.joinDate}>
                            <CalendarDays size={20} color='rgb(149, 149, 149)' />
                            <p>Joined {profile.join_date}</p>
                        </div>
                    </div>
                </section>
                <h2>Posts</h2>
                {profile.posts.map(post => <Post key={post.id} post={post} setPosts={setPosts} setProfile={setProfiles} />)}
            </div>
        </main>
    )
}