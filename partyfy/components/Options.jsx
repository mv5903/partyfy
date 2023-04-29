import ClearTable from './ClearTable';
import styles from '../styles/Options.module.css';

export default function Options({ setIsAHost }) {
    return (
        <div className={styles.options}>
            <h3>Options</h3>
            <div className="d-flex">
                <ClearTable table={'Queue'} />  
                <ClearTable table={'Recently Played'} />
            </div>
            <button className="btn btn-primary" onClick={() => setIsAHost(null)}>Return to Mode Selection</button>
        </div>
    )
}