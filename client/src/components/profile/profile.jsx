import styles from './profile.module.css'
import { useState, useContext, useEffect, useMemo, useRef} from 'react'
import { useOutletContext, useParams, Link } from 'react-router'
import { ArrowLeft, CalendarDays, LoaderCircle, Lock } from 'lucide-react'
import { AuthContext } from '../../contexts'
import Post from '../post/post'
import Users from '../users-list/users-list'
import { formatNumber, formatDateWithoutTimeAndDay } from '../../date-format'
import Popup from '../popup/popup'
import Image from '../full-image/image';
import { Virtuoso } from 'react-virtuoso'
export default function Profile () {
    const { user, setUser, containerRef } = useContext(AuthContext);
    const { userId }  = useParams();
    const { setConnectedToRooms, cachedUsers, setCachedUsers, setPosts, followage, setFollowage, setFullPosts } = useOutletContext();
    const [profileLoading, setProfileLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [error, setError] = useState(false);
    const [imageURL, setImageURL] = useState(null)
    const [type, setType] = useState(null);
    const [isHovered, setHover] = useState(false);
    const [edit, setEdit] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [image, setImage] = useState(null);
    const [editingProfile, setEditingProfile] = useState(false)
    const [profileError, setProfileError] = useState(null);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const popupText = useRef(null);
    const profile = useMemo(() => cachedUsers[userId], [userId, cachedUsers]);
    const handleEditButton = () => {
        setEdit(prev => {
            setFirstName(profile?.first_name);
            setLastName(profile?.last_name);
            setBio(profile?.bio);
            return !prev;
        })
    }
    const handleFollowage = async(e) => {
        if(e.currentTarget.dataset.func === 'unfollow') {
            const name = e.target.dataset.name;
            const confirm = window.confirm(`Are you sure you want to unfollow ${name} ?`)
            if(!confirm) {
                return;
            }
            try {
                setLoading(true)
                const userId = +e.target.id
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/unfollow/${userId}`, {
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
                setCachedUsers(prev => (prev[userId]?._count ? {...prev, [userId]: {...prev[userId], isFollowed: false, isLocked: true, _count: {...prev[userId]._count, followers: prev[userId]._count.followers - 1}}} : prev))
                setCachedUsers(prev => (prev[user.id]?._count ? {...prev, [user.id]: {...prev[user.id], _count: {...prev[user.id]._count, following: prev[user.id]._count.following - 1}}} : prev))
                setPosts(prev => {
                    return Object.fromEntries(
                        Object.entries(prev).filter(([_id, post]) => post.authorId !== userId)
                    )
                })
                setUser(prev => ({...prev, following: prev.following.filter(follow => follow.followingId !== userId)}))
                setConnectedToRooms(false)
                const isFetched = followage[user.id]?.following;
                if(isFetched) {
                    setFollowage((prev) => {
                        const index = isFetched.findIndex(id => id === userId)
                        if(index > -1) {
                            const following = isFetched.toSpliced(index, 1);
                            return {...prev, [user.id]: {...prev[userId], following: following}}
                        }
                        return prev;
                    })
                }
                setError(false)
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setError(true)
                setTimeout(() => setError(false), 3000)
                popupText.current = 'An error has occured, please try again later'
            } finally {
                setLoading(false)
            }
        } else if(e.currentTarget.dataset.func === 'follow') {
            try {
                setLoading(true)
                const userId = +e.target.id
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/send/${userId}`, {
                    method: 'POST',
                    credentials: 'include',
                })
                if(request.status === 401) {
                    window.location.href = '/login';
                }
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                setCachedUsers(prev => ({...prev, [userId]: {...prev[userId], isPending: true}}))
                setError(false)
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setError(true)
                setTimeout(() => setError(false), 3000)
                popupText.current = 'An error has occured, please try again later'
            } finally {
                setLoading(false)
            }
        } else if(e.currentTarget.dataset.func === 'cancel') {
            const confirm = window.confirm(`Are you sure you want to cancel the request ?`)
            if(!confirm) {
                return;
            }
            try {
                setLoading(true)
                const userId = +e.target.id;
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/cancel-request/${userId}`, {
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
                setCachedUsers(prev => ({...prev, [userId]: {...prev[userId], isPending: false, isFollowed: false}}))
                setError(false)
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setError(true)
                setTimeout(() => setError(false), 3000)
                popupText.current = 'An error has occured, please try again later'
            } finally {
                setLoading(false)
            }
        }
    }
    const acceptRequest = async() => {
        try {
            setRequestLoading('accepting')
            const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/accept/${profile.id}`, {
                method: 'POST',
                credentials: 'include',
            })
            if(request.status === 401) {
                window.location.href = '/login';
            }
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            setCachedUsers(prev => {
                const currentUserProfile = prev[user.id]?._count;
                if(currentUserProfile) {
                    return {...prev,
                        [profile.id]: {...prev[profile.id], hasRequested: false, _count: {...prev[profile.id]._count, following: prev[profile.id]._count.following + 1}},
                        [user.id]: {...prev[user.id], _count: {...prev[user.id]._count, followers: prev[user.id]._count.followers + 1}}
                    }
                }
                return {...prev, [profile.id]: {...prev[profile.id], hasRequested: false, _count: {...prev[profile.id]._count, following: prev[profile.id]._count.following + 1}}
            }})
            setFollowage(prev => {
                const copy = {...prev}
                if(prev[user.id]?.followers) {
                    // eslint-disable-next-line no-unused-vars
                    const {followers, ...rest} = copy[user.id];
                    copy[user.id] = rest;
                }
                if(prev[profile.id]?.following) {
                    // eslint-disable-next-line no-unused-vars
                    const {following, ...rest} = copy[profile.id];
                    copy[profile.id] = rest;
                }
                return copy;
            })
            setError(false)
        // eslint-disable-next-line no-unused-vars
        } catch(err) {
            setError(true)
            setTimeout(() => setError(false), 3000)
            popupText.current = 'An error has occured, please try again later'
        } finally {
            setRequestLoading(false)
        }
    }
    const cancelRequest = async() => {
        const confirm = window.confirm(`Are you sure you want to cancel the request ?`)
        if(!confirm) {
            return;
        }
        try {
            setRequestLoading('canceling')
            const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/reject/${profile.id}`, {
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
            setCachedUsers(prev => ({...prev, [profile.id]: {...prev[profile.id], hasRequested: false}}))
            setError(false)
        // eslint-disable-next-line no-unused-vars
        } catch(err) {
            setError(true)
            setTimeout(() => setError(false), 3000)
            popupText.current = 'An error has occured, please try again later'
        } finally {
            setRequestLoading(false)
        }
    }
    const removeFollower = async(e) => {
        const name = e.target.dataset.name;
        const confirm = window.confirm(`Are you sure you want to remove ${name} ?`)
        if(!confirm) {
            return;
        }
        try {
            setLoading(true)
            const userId = +e.target.id;
            const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/remove-follower/${userId}`, {
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
            setFollowage(prev => {
                const index =  prev[profile.id]?.[type].findIndex(id => id === +userId)
                const followage = prev[profile.id]?.[type].slice();
                followage.splice(index, 1)
                return {...prev,
                    [profile.id]: {...prev[profile.id],
                    [type]: followage}}
            })
            setCachedUsers(prev => ({...prev, [profile.id]: {...prev[profile.id], _count: {...prev[profile.id]._count, followers: prev[profile.id]._count.followers - 1}}}))
            setError(false)
        // eslint-disable-next-line no-unused-vars
        } catch(err) {          
            setError(true)
            setTimeout(() => setError(false), 3000)
            popupText.current = 'An error has occured, please try again later'
        } finally {
            setLoading(false)
        }
    }
    const handleMouseEnter = () => setHover(true)
    const handleMouseLeave = () => setHover(false)
    const handleImageInput = (e) => {
        const file = e.target.files[0];
        if(file) {
            setImage(e.target.files[0])
        }
    }
    const cancelFile = () => {
        setImage(null);
        setProfileError(null);
        const input = document.querySelector('#picture')
        input.value = '';
    }
    const editProfile = async(e) => {
        e.preventDefault();
        if((!firstName || !lastName) && !image) {
            return setProfileError(['First or Last name must not be empty']);
        }
        if(image) {
            setEditingProfile(true)
            try {
                const form = new FormData();
                form.append('image', image)
                form.append('first_name', firstName)
                form.append('last_name', lastName)
                if(bio) {
                    form.append('bio', bio)
                }
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/upload`, {
                    method: 'PUT',
                    credentials: 'include',
                    body: form
                })
                if(request.status === 401) {
                    window.location.href = '/login';
                }
                const response = await request.json();
                if(!request.ok) {
                    const error = new Error(response.message || 'Invalid Request')
                    error.errors = response.errors;
                    throw error
                }
                setProfileSuccess(true);
                setTimeout(() => setProfileSuccess(false), 3500);
                popupText.current = 'Profile edited successfully';
                setEdit(false);
                cancelFile();
                setCachedUsers(prev => ({...prev, [profile.id]: {...prev[profile.id], first_name: response.user.first_name, last_name: response.user.last_name, bio: response.user.bio, picture_url: response.user.picture_url}}))
            } catch (err) {
                if(err.errors) {
                    setProfileError(err.errors)
                } else {
                    setProfileError([err.message])
                }
            } finally {
                setEditingProfile(false)
            }
        }
        if((firstName && lastName) && !image) {
            setEditingProfile(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        bio: bio
                    })
                })
                if(request.status === 401) {
                    window.location.href = '/login';
                }
                const response = await request.json();
                if(!request.ok) {
                    const error = new Error(response.message || 'Invalid Request')
                    error.errors = response.errors;
                    throw error
                }
                setProfileSuccess(true)
                setTimeout(() => setProfileSuccess(false), 3500)
                popupText.current = 'Profile edited successfully'
                setEdit(false)
                cancelFile()
                setCachedUsers(prev => ({...prev, [profile.id]: {...prev[profile.id], first_name: response.user.first_name, last_name: response.user.last_name, bio: response.user.bio}}))
            } catch (err) {
                if(err.errors) {
                    setProfileError(err.errors)
                } else {
                    setProfileError([err.message])
                }
            } finally {
                setEditingProfile(false)
            }
        }
    }
    useEffect(() => {
        const fetchProfile = async() => {
            setProfileLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
                    credentials: 'include'
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                const response = await request.json();
                if(user && response.profile.isLoggedOut) {
                    window.location.href = '/login';
                }
                
                setCachedUsers((prev) => ({...prev, [response.profile.id]: {...prev[response.profile.id], ...response.profile}}))
                setError(false)
            // eslint-disable-next-line no-unused-vars
            } catch(err) { 
                setError(true);
            } finally {
                setProfileLoading(false)
            }
        }
        if(userId) {
            const count = cachedUsers[userId]?.posts;
            if(!count) {
                fetchProfile();
            }
        }
    }, [userId, setCachedUsers, cachedUsers, user])
    useEffect(() => {
        containerRef.current.scrollTo({top: 0, behavior: 'instant'})
    }, [containerRef])
    return (
        <>
        <Image imageURL={imageURL} setImageURL={setImageURL}/>
        <Popup borderColor={error ? 'red' : profileSuccess ? '#00d846' : null} shouldRender={error || profileSuccess} close={setError} >
            {profileSuccess ? 
            <p>Profile edited successfully</p>
            : error ?
            <p>An error has occured, please try again later</p>
            : <p>{popupText.current}</p>
            }
        </Popup>
        <Users userId={userId} type={type} setType={setType} cachedUsers={cachedUsers} setCachedUsers={setCachedUsers} handleFollowage={handleFollowage} followage={followage} setFollowage={setFollowage} removeFollower={removeFollower} />
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                {!profile?._count ? 
                <h1>Profile</h1> :
                user ?
                <h1>{profile.id === user.id ? 'My' : `${profile.first_name}'s`} Profile</h1> :
                <h1>{profile.first_name}&apos;s Profile</h1>
                }
            </header>
            {(!profileLoading && !profile?._count) && 
                    <div className={styles.loadingDiv}>
                        <p>Couldn&apos;t Load Content</p>
                    </div>}
            {profileLoading && 
                    <div className={styles.loadingDiv}>
                        <LoaderCircle className={styles.loading} size={50} />
                        <p>This may take a while</p>
                    </div>}
            {(!profileLoading && profile?._count) && 
            <div className={styles.container}>
                <section className={styles.info}>
                    {profile.hasRequested && 
                    <section className={styles.request}>
                        <div>
                            <p><em>{profile.first_name} has requested to follow you</em></p>
                            <div className={styles.buttons}>
                                <button disabled={requestLoading} onClick={acceptRequest}>
                                    {requestLoading === 'accepting' ? 
                                    <LoaderCircle  size={28} color='white' className={styles.loading}/> :
                                    'Accept'}
                                    </button>
                                <button disabled={requestLoading} onClick={cancelRequest}>
                                    {requestLoading === 'canceling' ? 
                                    <LoaderCircle  size={28} color='white' className={styles.loading}/> :
                                    'Cancel'}
                                </button>
                            </div>
                        </div>
                    </section>}
                    <div className={styles.left}>
                        <img src={profile.picture_url || '/no-profile-pic.jpg'} alt={`${profile.first_name} ${profile.last_name} profile picture`} loading='lazy' onClick={() => setImageURL(profile.picture_url)} role='button' tabIndex={0} />
                    </div>
                    <div className={styles.right}>
                        {(!user && !edit) &&
                        <div className={styles.top}>
                            <p className={styles.name}>{profile.first_name} {profile.last_name}</p>
                        </div>
                        }
                        {user && (!edit ?
                        <div className={styles.top}>
                            <p className={styles.name}>{profile.first_name} {profile.last_name}</p>
                            {profile?.id === user?.id && 
                            <p className={styles.username}>@{user.username}</p>
                            }
                            {profile.id !== user.id ? <button id={profile.id} disabled={loading} data-name={profile.first_name} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} data-func={profile.isFollowed ? 'unfollow' : profile.isPending ? 'cancel' : 'follow'} onClick={handleFollowage} style={{backgroundColor: (profile.isFollowed && isHovered) || (profile.isPending && isHovered) ? 'red' : profile.isPending || (profile.isFollowed && !isHovered) ? '#181818' : null, color: profile.isFollowed || profile.isPending ? 'inherit' : 'black'}}>
                                {loading ? 
                                <LoaderCircle  size={30} color='white' className={styles.loading}/>
                                : profile.isFollowed && !isHovered ? 'Following' : profile.isFollowed && isHovered ? 'Unfollow' : profile.isPending && !isHovered ? 'Pending' : profile.isPending && isHovered ? 'Cancel' : 'Follow'}</button> :
                            <button style={{color: 'black'}} onClick={handleEditButton}>Edit</button>}
                        </div> :
                        <form onSubmit={editProfile} className={styles.profileForm}>
                            {profileError && 
                            <ul>
                                {profileError.map((error, index) => <li key={index}><p>✘ {error}</p></li>)}
                            </ul>
                            }
                            <label htmlFor="picture" hidden>Group picture</label>
                            <input type="file" id='picture' accept='image/*' onChange={handleImageInput} />
                            <label htmlFor="first_name" hidden></label>
                            <input type="text" id='first_name' value={firstName} required minLength={2} maxLength={20} placeholder='First Name' onChange={(e) => setFirstName(e.target.value)} />
                            <label htmlFor="last_name" hidden></label>
                            <input type="text" id='last_name' value={lastName} required minLength={2} maxLength={20}  placeholder='Last Name' onChange={(e) => setLastName(e.target.value)} />
                            <label htmlFor="bio" hidden></label>
                            <textarea type="text" id='bio' value={bio || ''} maxLength={300} placeholder='Bio' onChange={(e) => setBio(e.target.value)}></textarea>
                            <div className={styles.buttons}>
                                <button className={styles.edit} disabled={editingProfile}>{editingProfile ? <LoaderCircle  size={28} color='white' className={styles.loading}/> : 'Submit'}</button>
                                <button type='button' className={styles.cancel} disabled={editingProfile} onClick={() => setEdit(false)}>Cancel</button>
                            </div>
                        </form>
                        )}
                        {!edit && <p className={styles.bio}>{profile.bio}</p>}
                        <div className={styles.followage}>
                            <button disabled={profile.isLocked} onClick={() => setType('following')}><em>{formatNumber(profile._count.following)}</em> Following</button>
                            <button disabled={profile.isLocked} onClick={() => setType('followers')}><em>{formatNumber(profile._count.followers)}</em>{profile._count.followers === 1 ? ' Follower' : ' Followers'}</button>
                            <p><em>{formatNumber(profile._count?.posts ?? profile.posts?.length)}</em> Posts</p>
                        </div>
                        <div className={styles.joinDate}>
                            <CalendarDays size={20} color='rgb(149, 149, 149)' />
                            <p>Joined {formatDateWithoutTimeAndDay(profile.join_date)}</p>
                        </div>
                    </div>
                </section>
                <h2>Posts</h2>
                {profile.isLocked ? 
                <div className={styles.locked}>
                    <Lock size={25} />
                    <div className={styles.lockedRight}>
                        <p><em>This account is private</em></p>
                        <p>{user ? 'Follow to see their posts' :
                        <>
                        <Link to='/login'>Login</Link>
                        &nbsp;to follow them
                        </>
                        }</p>
                    </div>
                </div> :
                profile.posts?.length === 0 ?
                <div className={styles.locked}>
                    <div className={styles.lockedRight}>
                        <p style={{fontSize: '1.2rem'}}><em>No posts yet</em></p>
                    </div>
                </div> :
                <Virtuoso
                        increaseViewportBy={{bottom: 200, top: 200}}
                        customScrollParent={containerRef.current}
                        data={profile.posts}
                        itemContent={(index, post) => {
                            const isLast =
                                index === profile.posts.length - 1
                                    ? true
                                    : false;
                            return <Post key={post.id} post={post} setPosts={setPosts} setCachedUsers={setCachedUsers} setFullPosts={setFullPosts} isLast={isLast} />
                        }}
                />
                }
            </div>
            }
        </main>
        </>
    )
}