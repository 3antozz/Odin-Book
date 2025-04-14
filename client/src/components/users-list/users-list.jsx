import styles from './users-list.module.css'
import { useState, useContext, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Popup from "../popup/popup"
import { AuthContext } from '../../contexts'
import { X, UserPlus, LoaderCircle, Search } from 'lucide-react';

export default function Users ({userId = null, type = null, setType = () => {}, followage = {}, setFollowage = () => {}, handleFollowage = () => {}, removeFollower = () => {}, likes = null, setLikes = () => {}}) {
    const { user } = useContext(AuthContext)
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [addingMember, setAddingMember] = useState(0);
    const [memberAdded, setMemberAdded] = useState(false);
    const [hoverId, setHoverId] = useState(null)
    const users = followage[userId]?.[type] || likes;
    const profile = followage[userId];
    let filteredUsers = users;
    if(searchValue && users) {
        filteredUsers = users.filter((user) => {
            let profile = user;
            if(type) {
                profile = type === 'followers' ? user.follower : user.following;
            }
            return `${profile.first_name} ${profile.last_name}`.toLowerCase().includes(searchValue.toLowerCase()
        )});
    }
    const handleMouseEnter = (e) => setHoverId(+e.target.id)
    const handleMouseLeave = () => setHoverId(null)
    useEffect(() => {
        const fetchFollowage = async() => {
            setLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/${type}`, {
                    credentials: 'include'
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                    }
                const response = await request.json();
                console.log(response)
                setFollowage((prev) => ({...prev, [response.profile.id]: {...prev[response.profile.id], ...response.profile}}))
                setError(false)
            } catch(err) {
                console.log(err)
                setError(true);
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
    }, [followage, type, userId, setType, setFollowage])
    if(!users) {
        return <></>
    }
    return (
        <dialog open={type || likes} className={styles.backdrop} id='backdrop' onClick={(e) => {
            if(e.target.id === 'backdrop') {
                setType(null)
                setLikes(null)
            }}}>
            <section className={styles.addUsers}>
                {type && <h2>{profile.first_name}&apos;s {type}</h2>}
                {likes && <h2>Likes</h2>}
                <>
                <div className={styles.searchDiv}>
                    <label htmlFor="user" hidden>Search for a user</label>
                    <input type="text" id='user' value={searchValue} placeholder='Search a user' onChange={(e) => setSearchValue(e.target.value)} />
                    <Search className={styles.searchIcon}/>
                </div>
                <ul className={styles.members}>
                    {filteredUsers.map((follow) => {
                        let member = follow;
                        if(type) {
                            member = type === 'followers' ? follow.follower : follow.following
                        }
                        return (
                            <li className={styles.member} key={member.id}>
                                <div className={styles.memberButton}>
                                    <Link to={`/profile/${member.id}`}><img src={member.picture_url || '/no-profile-pic.jpg'} alt={`${member.first_name} ${member.last_name} profile picture`}></img></Link>
                                    <Link to={`/profile/${member.id}`}>{member.first_name} {member.last_name}</Link>
                                    {(member.id !== user.id && type ==='following') && <button id={member.id} data-name={member.first_name} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} data-func={member.isFollowed ? 'unfollow' : member.isPending ? 'cancel' : 'follow'} onClick={handleFollowage} style={{backgroundColor: (member.isFollowed && hoverId === member.id) || (member.isPending && hoverId === member.id) ? '#d51111' : member.isPending || (member.isFollowed && hoverId !== member.id) ? '#181818' : null, color: member.isFollowed || member.isPending ? 'inherit' : 'black'}}>{member.isFollowed && hoverId !== member.id ? 'Following' : member.isFollowed && hoverId === member.id ? 'Unfollow' : member.isPending && hoverId !== member.id ? 'Pending' : member.isPending && hoverId === member.id ? 'Cancel' : 'Follow'}</button>}
                                    {(member.id !== user.id && type ==='followers') && <button className={styles.removeFollower} id={member.id} onClick={removeFollower} data-name={member.first_name} data-func='remove-follower'>Remove</button>}
                                </div>
                            </li>
                        )
                    })}
                </ul>
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
}



