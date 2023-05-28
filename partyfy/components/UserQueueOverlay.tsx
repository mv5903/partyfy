import styles from '../styles/Queue.module.css'

const UserQueueOverlay = ({ user, showOverlay, setShowOverlay } : { user : any, showOverlay: boolean, setShowOverlay: Function }) => {
    console.log(showOverlay);

    return (
        <div>
            {
                user && showOverlay &&
                <div className={styles.overlay}>
                    Test
                    <button className="btn" onClick={setShowOverlay(false)}>Close</button>
                </div>
            }
        </div>
    );
}

export default UserQueueOverlay;