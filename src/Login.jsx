import {LoginForm} from './components/login-form.jsx';
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'
import { useNavigate } from 'react-router';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublicKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabasePublicKey);


export function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const naviagate = useNavigate();

    function handleEmailChange(e){
        setEmail(e.target.value);
    }

    function handlePasswordChange(e){
        setPassword(e.target.value);
    }

    async function signIn(email, password){
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
        } catch(err){

        }
    }

    return(
        <>
            <LoginForm email={email} password={password} handleEmailChange={handleEmailChange} handlePasswordChange={handlePasswordChange} onSubmit={signIn}/>
        </>
    );
}