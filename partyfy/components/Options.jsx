import ClearTable from './ClearTable';
import styles from '../styles/Options.module.css';

export default function Options() {
    return (
        <div className={styles.options}>
            <h3>Options</h3>
            <div className="d-flex">
                <ClearTable table={'Queue'} />  
                <ClearTable table={'Recently Played'} />
            </div>
        </div>
    )
}