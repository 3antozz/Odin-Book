import styles from './profile.module.css'
import { useState, useContext, useEffect, useMemo} from 'react'
import { useOutletContext, useParams, Link } from 'react-router'
import { ArrowLeft, CalendarDays, LoaderCircle, Lock } from 'lucide-react'
import { AuthContext } from '../../contexts'
import Post from '../post/post'
import Users from '../users-list/users-list'
import { formatNumber } from '../../date-format'
import Popup from '../popup/popup'
export default function Profile () {
    const { user } = useContext(AuthContext);
    const { userId }  = useParams();
    const { setPosts, profiles, setProfiles, followage, setFollowage, setFullPosts } = useOutletContext();
    const [profileLoading, setProfileLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [type, setType] = useState(null)
    const [isHovered, setHover] = useState(false)
    const [edit, setEdit] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [image, setImage] = useState(null);
    const [editingProfile, setEditingProfile] = useState(false)
    const [profileError, setProfileError] = useState(null);
    const [profileSuccess, setProfileSuccess] = useState(false)
    const profile = useMemo(() => profiles[userId], [userId, profiles])
    console.log(profile)
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
                const response = await request.json();
                console.log(response)
                setProfiles(prev => (prev[userId] ? {...prev, [userId]: {...prev[userId], isFollowed: false, isLocked: true, _count: {...prev[userId]._count, followers: prev[userId]._count.followers - 1}}} : prev))
                setPosts(prev => {
                    return Object.fromEntries(
                        Object.entries(prev).filter(([_id, post]) => post.authorId !== userId)
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
                            [profile.idd]: {...prev[profile.id],
                            [type]: followage}}
                    })
                }
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true)
                setTimeout(() => setError(false), 3000)
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
                const response = await request.json();
                console.log(response)
                setProfiles(prev => ({...prev, [userId]: {...prev[userId], isPending: true}}))
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
                setTimeout(() => setError(false), 3000)
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
                const response = await request.json();
                console.log(response)
                setProfiles(prev => ({...prev, [userId]: {...prev[userId], isPending: false, isFollowed: false}}))
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
                setTimeout(() => setError(false), 3000)
            } finally {
                setLoading(false)
            }
        }
    }
    const acceptRequest = async() => {
        try {
            setLoading(true)
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
            setTimeout(() => setError(false), 3000)
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
            setLoading(true)
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
            const response = await request.json();
            console.log(response)
            setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], hasRequested: false}}))
            setError(false)
        } catch(err) {
            console.log(err)
            setError(true)
            setTimeout(() => setError(false), 3000)
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
            setTimeout(() => setError(false), 3000)
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
                setEdit(false);
                cancelFile();
                setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], first_name: response.user.first_name, last_name: response.user.last_name, bio: response.user.bio, picture_url: response.user.picture_url}}))
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
                setEdit(false)
                cancelFile()
                setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], first_name: response.user.first_name, last_name: response.user.last_name, bio: response.user.bio}}))
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
                if(request.status === 401) {
                    window.location.href = '/login';
                }
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
                setProfileLoading(false)
            }
        }
        if(userId) {
            const profile = profiles[userId];
            if(!profile) {
                fetchProfile();
            }
        }
    }, [userId, profiles, setProfiles])
    return (
        <>
        <Popup borderColor={error ? 'red' : profileSuccess ? '#00d846' : null} shouldRender={error || profileSuccess} close={setError} >
            {profileSuccess ? 
            <p>Profile edited successfully</p>
            :
            <p>An error has occured, please try again later</p>
            }
        </Popup>
        <Users userId={userId} type={type} setType={setType} handleFollowage={handleFollowage} followage={followage} setFollowage={setFollowage} removeFollower={removeFollower} />
        <main className={styles.main}>
            <header>
                <Link to={-1} className={styles.close}><ArrowLeft size={35} color='white'/></Link>
                {!profile ? 
                <h1>Profile</h1> :
                user ?
                <h1>{profile.id === user.id ? 'My' : `${profile.first_name}'s`} Profile</h1> :
                <h1>{profile.first_name}&apos;s Profile</h1>
                }
            </header>
            {(!profileLoading && !profile) && 
                    <div className={styles.loadingDiv}>
                        <p>Couldn&apos;t Load Content</p>
                    </div>}
            {profileLoading && 
                    <div className={styles.loadingDiv}>
                        <LoaderCircle className={styles.loading} size={50} />
                        <p>This may take a while</p>
                    </div>}
            {(!profileLoading && profile) && 
            <div className={styles.container}>
                <section className={styles.info}>
                    {profile.hasRequested && 
                    <section className={styles.request}>
                        <div>
                            <p><em>{profile.first_name} has requested to follow you</em></p>
                            <div className={styles.buttons}>
                                <button disabled={loading} onClick={acceptRequest}>
                                    {loading ? 
                                    <LoaderCircle  size={28} color='white' className={styles.loading}/> :
                                    'Accept'}
                                    </button>
                                <button disabled={loading} onClick={cancelRequest}>
                                    {loading ? 
                                    <LoaderCircle  size={28} color='white' className={styles.loading}/> :
                                    'Cancel'}
                                </button>
                            </div>
                        </div>
                    </section>}
                    <div className={styles.left}>
                        <img src={profile.picture_url || '/no-profile-pic.jpg'} alt={`${profile.first_name} ${profile.last_name} profile picture`} />
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
                            <button disabled={profile.isLocked} onClick={() => setType('followers')}><em>{formatNumber(profile._count.followers)}</em> Followers</button>
                            <p><em>{formatNumber(profile._count?.posts || profile.posts?.length)}</em> Posts</p>
                        </div>
                        <div className={styles.joinDate}>
                            <CalendarDays size={20} color='rgb(149, 149, 149)' />
                            <p>Joined {profile.join_date}</p>
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
                profile.posts.map(post => <Post key={post.id} post={post} setPosts={setPosts} setProfiles={setProfiles} setFullPosts={setFullPosts} />)}
            </div>}
        </main>
        </>
    )
}