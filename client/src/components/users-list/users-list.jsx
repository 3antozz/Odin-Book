import styles from './users-list.module.css'
import { useState, useContext, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { AuthContext } from '../../contexts'
import { X, LoaderCircle, Search } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso'

export default function Users ({userId = null, type = null, setType = () => {}, cachedUsers, setCachedUsers, followage = {}, setFollowage = () => {}, handleFollowage = () => {}, removeFollower = () => {}, likes = null, setLikes = () => {}}) {
    const { user } = useContext(AuthContext)
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false)
    const [loadingError, setLoadingError] = useState(false)
    const [hoverId, setHoverId] = useState(null)
    const [userLoading, setUserLoading] = useState(0)
    const users = followage[userId]?.[type] || likes;
    const profile = cachedUsers[userId];
    let filteredUsers = users;
    if(searchValue && users) {
        filteredUsers = users.filter((id) => {
            let profile = cachedUsers[id];
            if(likes) {
                profile = id;
            }
            return `${profile.first_name} ${profile.last_name}`.toLowerCase().includes(searchValue.toLowerCase()
        )});
    }
    const handleFollowing = async(e) => {
        setUserLoading(+e.target.id);
        await handleFollowage(e)
        setUserLoading(0)
    }
    const handleFollowers = async(e) => {
        setUserLoading(+e.target.id);
        await removeFollower(e)
        setUserLoading(0)
    }
    const handleMouseEnter = (e) => setHoverId(+e.target.id)
    const handleMouseLeave = () => setHoverId(null)
    useEffect(() => {
        const fetchFollowage = async() => {
            setLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/followage/${userId}/${type}`, {
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
                
                let followIds = [];
                setCachedUsers((prev) => {
                    const follows = {};
                    followIds = [];
                    response.profile[type].forEach((follow) => {
                        if(type === 'followers') {
                            follows[follow.follower.id] = follow.follower
                            followIds.push(follow.follower.id)
                        } else if (type === 'following') {
                            follows[follow.following.id] = follow.following
                            followIds.push(follow.following.id)
                        }
                    })
                    return {...prev, ...follows}
                })
                setFollowage((prev) => ({...prev, [response.profile.id]: {...prev[response.profile.id], [type]: followIds}}))
                setLoadingError(false)
            // eslint-disable-next-line no-unused-vars
            } catch(err) {
                setLoadingError(true);
                setTimeout(() => setLoadingError(false), 3000)
            } finally {
                setLoading(false)
            }
        }
        if(userId && type) {
            const profile = followage[userId]?.[type];
            if(!profile) {
                fetchFollowage();
            }
        }
    }, [followage, type, userId, setType, setFollowage, setCachedUsers])
    if(!loading && !users) {
        return <></>
    }
    return (
        <dialog open={type || likes} className={styles.backdrop} id='backdrop' onClick={(e) => {
            if(e.target.id === 'backdrop') {
                setType(null)
                setLikes(null)
            }}}>
            <section className={styles.addUsers}>
                {(type && !profile) &&<h2>{type}</h2>}
                {(type && profile) &&<h2>{profile.first_name}&apos;s {type}</h2>}
                {likes && <h2>Likes</h2>}
                <>
                <div className={styles.searchDiv}>
                    <label htmlFor="user" hidden>Search for a user</label>
                    <input type="text" id='user' disabled={!users} value={searchValue} placeholder='Search a user' onChange={(e) => setSearchValue(e.target.value)} />
                    <Search className={styles.searchIcon}/>
                </div>
                {loading ? 
                <div className={styles.loadingDiv}>
                    <LoaderCircle className={styles.loading} size={50} />
                    <p>This may take a while</p>
                </div> :
                loadingError ? 
                    <div className={styles.loadingDiv}>
                        <p>Couldn&apos;t Load Content</p>
                    </div> :
                <ul className={styles.members}>
                    <Virtuoso
                    increaseViewportBy={{bottom: 100, top: 100}}
                    style={{height: '100%'}}
                    data={filteredUsers}
                    itemContent={(_, follow) => {
                    let member;
                    if(!likes) {
                        member = cachedUsers[follow];
                    } else {
                        member = follow;
                    }
                    return (
                        <li className={styles.member} key={member.id}>
                            <div className={styles.memberButton}>
                                <Link to={`/profile/${member.id}`} onClick={() => setType(null)}><img src={member.picture_url || '/no-profile-pic.jpg'} alt={`${member.first_name} ${member.last_name} profile picture`} loading='lazy'></img></Link>
                                <Link to={`/profile/${member.id}`} onClick={() => setType(null)}>{member.first_name} {member.last_name}</Link>
                                {
                                (!likes && user && (+userId === user?.id && type !== 'followers' || +userId !== user?.id) && (member.id !== user?.id)) && 
                                <button id={member.id} data-name={member.first_name} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} data-func={member.isFollowed ? 'unfollow' : member.isPending ? 'cancel' : 'follow'} onClick={handleFollowing} style={{backgroundColor: (member.isFollowed && hoverId === member.id) || (member.isPending && hoverId === member.id) ? '#d51111' : member.isPending || (member.isFollowed && hoverId !== member.id) ? '#181818' : null, color: member.isFollowed || member.isPending ? 'inherit' : 'black'}}>
                                {userLoading === member.id ?
                                <LoaderCircle  size={28} color={member.isPending ? 'white' : 'purple'} className={styles.loading}/> :
                                member.isFollowed && hoverId !== member.id ? 'Following' : member.isFollowed && hoverId === member.id ? 'Unfollow' : member.isPending && hoverId !== member.id ? 'Pending' : member.isPending && hoverId === member.id ? 'Cancel' : 'Follow'}
                                </button>
                                }
                                {!likes && (user && (userId == user?.id) && (member.id !== user?.id && type ==='followers')) && <button className={styles.removeFollower} id={member.id} onClick={handleFollowers} data-name={member.first_name} data-func='remove-follower'>
                                {userLoading === member.id ?
                                <LoaderCircle  size={28} color='white' className={styles.loading}/> :
                                'Remove'
                                }
                                </button>}
                            </div>
                        </li>
                    )}}
                    />
                </ul>
                }
                <button className={styles.close} onClick={() => {
                    setType(null)
                    setLikes(null)}}><X size={38} color='white'/></button>
                </>
            </section>
        </dialog>
    )
}



Users.propTypes = {
    setType: PropTypes.func.isRequired,
    handleFollowage: PropTypes.func.isRequired,
    userId: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    followage: PropTypes.object.isRequired,
    setFollowage: PropTypes.func.isRequired,
    removeFollower: PropTypes.func.isRequired,
    likes: PropTypes.array.isRequired,
    setLikes: PropTypes.func.isRequired,
    cachedUsers: PropTypes.object.isRequired,
    setCachedUsers: PropTypes.func.isRequired,
}



