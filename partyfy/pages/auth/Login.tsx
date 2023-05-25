import styles from '@/styles/auth/login.module.css'
import Link from 'next/link'

export default function Login() {

    function login() {
        alert('test login')
    }

    function register() {
        alert('test register')
    }

    return (
        <div>
            <br></br>
            <button onClick={login}>Already have an account?</button>
        </div>
    );
}