import styles from './image.module.css'
import { memo } from 'react'
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const Image = memo(function Image ({imageURL, setImageURL}) {
    return (
        <dialog open={imageURL} className={styles.backdrop} id='backdrop' onClick={(e) => e.target.id === 'backdrop' && setImageURL(null)}>
            <section className={styles.image}>
                <img src={imageURL} />
                <button className={styles.close} onClick={() => setImageURL(null)}><X size={50} color='white'/></button>
            </section>
        </dialog>
    )
})



Image.propTypes = {
    imageURL: PropTypes.string.isRequired,
    setImageURL: PropTypes.func.isRequired,
}

export default Image;



