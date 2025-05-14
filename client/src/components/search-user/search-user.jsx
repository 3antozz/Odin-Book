import styles from './search-user.module.css'
import { memo, useState, useRef, useEffect } from 'react'
import { Link } from 'react-router';
import { LoaderCircle, Search, X } from 'lucide-react';

const SearchUser = memo(function CreatePost () {
    const [result, setResult] = useState([])
    const [cache, setCache] = useState({})
    const [value, setValue] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const delay = useRef(null)
    const controller = useRef(null)
    const handleInput = (e) => {
        setValue(e.target.value)
        setLoading(true)
        const search = e.target.value.trim();
        clearTimeout(delay.current);
        if(cache[search]) {
            setResult(cache[search])
            setLoading(false)
            return;
        }
        delay.current = setTimeout(() => searchUser(search), 300)
    }
    const searchUser = async(query) => {
        if(query.length < 2) {
            setResult([]);
            setLoading(false)
            return;
        }
        controller.current?.abort();
        const abortControl = new AbortController();
        controller.current = abortControl;
        try {
            setLoading(true)
            const request = await fetch(`${import.meta.env.VITE_API_URL}/users/search/?q=${query}`, {
                signal: abortControl.signal,
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
            
            setResult(response.users);
            setCache(prev => ({...prev, [query]: response.users}))
        } catch(err) {
            if (err.name !== "AbortError") setError(true);
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        return () => {
            clearTimeout(delay.current);
            controller.current?.abort();
        }
    }, [])
    return (
        <section className={styles.searchContainer}>
            <div className={styles.top}>
                <img src="/circ.png" alt="Odinbook logo" />
                <div className={styles.searchDiv}>
                    <label htmlFor="search" hidden>Search for a user</label>
                    <input type="text" id="search" placeholder='Search' value={value} onChange={handleInput} />
                    <Search className={styles.searchIcon}/>
                </div>
            </div>
            <div className={styles.result}>
                <button type='button' className={styles.close} onClick={() => document.activeElement.blur()}><X size={25} color='#c4c4c4'/></button>
                {loading ? 
                <div className={styles.loadingDiv}>
                    <LoaderCircle className={styles.loading} size={30} />
                </div> :
                error ?
                <div className={styles.loadingDiv}>
                    <p>Error loading content</p>
                </div> :
                result.length > 0 ? result.map(user => 
                <li className={styles.member} key={user.id}>
                    <Link to={`/profile/${user.id}`} className={styles.memberButton}>
                        <img src={user.picture_url || '/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`}></img>
                        <p>{user.first_name} {user.last_name}</p>
                    </Link>
                </li>
                ) :
                (value && result.length === 0) ?
                <p>No user found</p>
                :
                <p>Try searching for a user</p>}
            </div>
        </section>
    )
})



SearchUser.propTypes = {
}

export default SearchUser;



