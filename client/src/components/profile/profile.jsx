import styles from './profile.module.css'
import { useState, useContext, useEffect, useMemo, useRef } from 'react'
import { useOutletContext, useParams, Link } from 'react-router'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { AuthContext } from '../../contexts'
import Post from '../post/post'
import Users from '../users-list/users-list'
export default function Profile () {
    const { user } = useContext(AuthContext);
    const { userId }  = useParams();
    const { setPosts, profiles, setProfiles, followage, setFollowage, setFullPosts } = useOutletContext();
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [type, setType] = useState(null)
    const [isHovered, setHover] = useState(false)
    const profile = useMemo(() => profiles[userId], [userId, profiles])
    const prevUserId = useRef(null);
    const handleFollowage = async(e) => {
        if(e.currentTarget.dataset.func === 'unfollow') {
            const name = e.target.dataset.name;
            const confirm = window.confirm(`Are you sure you want to unfollow ${name} ?`)
            if(!confirm) {
                return;
            }
            try {
                const userId = +e.target.id
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/unfollow/${userId}`, {
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
                setPosts(prev => {
                    return Object.fromEntries(
                        Object.entries(prev).filter(([id, post]) => post.authorId !== userId)
                    )
                })
                const isFetched = followage[profile.id]?.[type];
                if(isFetched) {
                    setFollowage(prev => {
                        const index =  prev[profile.id]?.[type].findIndex(follow => {
                            if(type === 'followers') {
                                return follow.follower.id === +userId
                            } else {
                                return follow.following.id === +userId
                            }
                        })
                        const followage = prev[profile.id]?.[type].slice();
                        if(type === 'followers') {
                            followage[index].follower = {...followage[index].follower, isFollowed: false}
                        } else {
                            followage[index].following = {...followage[index].following, isFollowed: false}
                        }
                        return {...prev,
                            [profile.id]: {...prev[profile.id],
                            [type]: followage}}
                    })
                }
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true)
            } finally {
                setLoading(false)
            }
        } else if(e.currentTarget.dataset.func === 'follow') {
            try {
                const userId = e.target.id
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/send/${userId}`, {
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
                const isFetched = followage[profile.id]?.[type];
                if(isFetched) {
                    setFollowage(prev => {
                        const index =  prev[profile.id]?.[type].findIndex(follow => {
                            if(type === 'followers') {
                                return follow.follower.id === +userId
                            } else {
                                return follow.following.id === +userId
                            }
                        })
                        const followage = prev[profile.id]?.[type].slice();
                        if(type === 'followers') {
                            followage[index].follower = {...followage[index].follower, isPending: true}
                        } else {
                            followage[index].following = {...followage[index].following, isPending: true}
                        }
                        return {...prev,
                            [profile.id]: {...prev[profile.id],
                            [type]: followage}}
                    })
                }
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
                const userId = e.target.id
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/cancel-request/${userId}`, {
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
                const isFetched = followage[profile.id]?.[type];
                if(isFetched) {
                    setFollowage(prev => {
                        const index =  prev[profile.id]?.[type].findIndex(follow => {
                            if(type === 'followers') {
                                return follow.follower.id === +userId
                            } else {
                                return follow.following.id === +userId
                            }
                        })
                        const followage = prev[profile.id]?.[type].slice();
                        if(type === 'followers') {
                            followage[index].follower = {...followage[index].follower, isPending: false}
                        } else {
                            followage[index].following = {...followage[index].following, isPending: false}
                        }
                        return {...prev,
                            [profile.id]: {...prev[profile.id],
                            [type]: followage}}
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
    const removeFollower = async(e) => {
        const name = e.target.dataset.name;
        const confirm = window.confirm(`Are you sure you want to remove ${name} ?`)
        if(!confirm) {
            return;
        }
        try {
            const userId = e.target.id
            const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/remove-follower/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            const response = await request.json();
            console.log(response)
            setFollowage(prev => {
                const index =  prev[profile.id]?.[type].findIndex(follow => follow.follower.id === +userId)
                const followage = prev[profile.id]?.[type].slice();
                followage.splice(index, 1)
                return {...prev,
                    [profile.id]: {...prev[profile.id],
                    [type]: followage}}
            })
            setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], _count: {...prev[profile.id]._count, followers: prev[profile.id]._count.followers - 1}}}))
            setError(false)
        } catch(err) {
            console.log(err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    const handleMouseEnter = () => setHover(true)
    const handleMouseLeave = () => setHover(false)
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
        return () => {
            if(prevUserId.current !== userId) {
                setType(null)
                prevUserId.current = userId
            }
        }
    }, [userId, profiles, setProfiles])
    if(!profile || !user) {
        return;
    }
    return (
        <>
        <Users userId={userId} type={type} setType={setType} handleFollowage={handleFollowage} followage={followage} setFollowage={setFollowage} removeFollower={removeFollower} />
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                <h1>{profile.id === user.id ? 'My' : `${profile.first_name}'s`} Profile</h1>
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
                            {profile.id !== user.id ? <button id={profile.id} data-name={profile.first_name} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} data-func={profile.isFollowed ? 'unfollow' : profile.isPending ? 'cancel' : 'follow'} onClick={handleFollowage} style={{backgroundColor: (profile.isFollowed && isHovered) || (profile.isPending && isHovered) ? 'red' : profile.isPending || (profile.isFollowed && !isHovered) ? '#181818' : null, color: profile.isFollowed || profile.isPending ? 'inherit' : 'black'}}>{profile.isFollowed && !isHovered ? 'Following' : profile.isFollowed && isHovered ? 'Unfollow' : profile.isPending && !isHovered ? 'Pending' : profile.isPending && isHovered ? 'Cancel' : 'Follow'}</button> :
                            <button style={{color: 'black'}}>Edit</button>}
                        </div>
                        <p className={styles.bio}>{profile.bio}</p>
                        <div className={styles.followage}>
                            <button onClick={() => setType('following')}><em>{profile._count.following}</em> Following</button>
                            <button onClick={() => setType('followers')}><em>{profile._count.followers}</em> Followers</button>
                            <p><em>{profile.posts.length}</em> Posts</p>
                        </div>
                        <div className={styles.joinDate}>
                            <CalendarDays size={20} color='rgb(149, 149, 149)' />
                            <p>Joined {profile.join_date}</p>
                        </div>
                    </div>
                </section>
                <h2>Posts</h2>
                {profile.posts.map(post => <Post key={post.id} post={post} setPosts={setPosts} setProfiles={setProfiles} setFullPosts={setFullPosts} />)}
            </div>
        </main>
        </>
    )
}