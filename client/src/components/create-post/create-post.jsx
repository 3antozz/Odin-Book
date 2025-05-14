import styles from './create-post.module.css'
import { memo, useState, useRef, useContext, useEffect } from 'react'
import PropTypes from 'prop-types';
import { X, LoaderCircle, Image, Trash } from 'lucide-react';
import { AuthContext } from '../../contexts'

const CreatePost = memo(function CreatePost ({creatingPost, setCreatingPost, setPosts, setCachedUsers, setFullPosts}) {
    const { user } = useContext(AuthContext);
    const [postTxt, setPostTxt] = useState('')
    const [image, setImage] = useState(null);
    const [uploadError, setUploadError] = useState(false)
    const [isUploading, setUploading] = useState(false)
    const requirement = useRef(document.querySelector('#max-size'))
    const fileDivRef = useRef(null);
    const textArea = useRef(null);
    const cancelFile = () => {
        setImage(null);
        setUploadError(false);
        if(fileDivRef.current) {
            fileDivRef.current.style.display = 'none'
            requirement.current.style.display = 'none'
        }
        const input = document.querySelector('#image')
        input.value = '';
    }
    const handlePostCreation = async(e) => {
        e.preventDefault();
        if(!postTxt && !image) {
            return;
        }
        setUploading(true)
        try {
            const form = new FormData();
            let request;
            if(postTxt) {
                form.append('content', postTxt)
            }
            if(image) {
                form.append('image', image)
                request = await fetch(`${import.meta.env.VITE_API_URL}/posts/image`, {
                    method: 'POST',
                    credentials: 'include',
                    body: form
                })
            } else if(postTxt && !image) {
                request = await fetch(`${import.meta.env.VITE_API_URL}/posts/text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        content: postTxt
                    })
                })
            }
            const response = await request.json();
            if(request.status === 401) {
                window.location.href = '/login';
            }
            if(!request.ok) {
                const error = new Error(response.message)
                throw error;
            }
            
            setPosts(prev => ({[response.post.id]: response.post, ...prev}))
            setFullPosts((prev) => ({...prev, [response.post.id]: response.post}))
            setCachedUsers(prev => {
                const profileId = response.post.authorId;
                const profile = prev[profileId]?.posts;
                if(!profile) return prev;
                const posts = [response.post, ...profile];
                return {...prev, [profileId]: {...prev[profileId], posts}}
            })
            setPostTxt('');
            cancelFile()
            setCreatingPost(false)
        } catch (error) {
            setUploadError(error.message)
        } finally {
            setUploading(false)
        }
    }
    const handleFileClick = (e) => {
        const file = e.target.files[0];
        if(file) {
            setImage(e.target.files[0])
            if(fileDivRef.current) {
                fileDivRef.current.style.display = 'flex'
                requirement.current.style.display = 'block'
            }
        } else {
            setImage(null)
            setUploadError(false)
            if(fileDivRef.current) {
                fileDivRef.current.style.display = 'none'
                requirement.current.style.display = 'none'
            }
        }
    }
    useEffect(() => textArea.current.focus(), [creatingPost])
    return (
        <dialog open={creatingPost} className={styles.backdrop}>
            <div className={styles.container}>
                <div className={styles.head}>
                    <img src={user.picture_url || '/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture` } loading='lazy' />
                    <h2>Create Post</h2>
                    <button type='button' className={styles.close} onClick={() => setCreatingPost(null)}><X size={30} color='#c4c4c4'/></button>
                </div>
                <form onSubmit={handlePostCreation} className={styles.form}>
                    <div className={styles.textarea}>
                        <img src={user.picture_url || '/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`} loading='lazy' />
                        <label htmlFor="text"></label>
                        <textarea  disabled={isUploading} ref={textArea} placeholder="What's happening?" value={postTxt} onChange={(e) => setPostTxt(e.target.value)} id="text"></textarea>
                    </div>
                    <div className={styles.buttons}>
                        <label htmlFor="image" className={styles.label}><Image color='white' size={33} /></label>
                        <div className={styles.file} ref={fileDivRef}>
                            <div>
                                <input type="file" id="image"
                                disabled={isUploading} accept='image/*' onChange={handleFileClick} />
                                <button onClick={cancelFile}><Trash color='white' size={25} /></button>
                            </div>
                        </div>
                        <button className={styles.post} disabled={isUploading}>
                        {isUploading ? 
                        <LoaderCircle  size={33} color='#2a3040' className={styles.loading}/> :
                        'Post'}
                        </button>
                    </div>
                    {uploadError ? <p className={styles.fileError}>{uploadError}</p> : <p className={styles.requirement} id='max-size' ref={requirement}>* Max size: 5 MB</p>}
                </form>
            </div>
        </dialog>
    )
})



CreatePost.propTypes = {
    creatingPost: PropTypes.bool.isRequired,
    setCreatingPost: PropTypes.func.isRequired,
    setPosts: PropTypes.func.isRequired,
    setCachedUsers: PropTypes.func.isRequired,
    setFullPosts: PropTypes.func.isRequired,
}

export default CreatePost;



