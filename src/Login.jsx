import {LoginForm} from './components/login-form.jsx';
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'
import { redirect } from 'react-router-dom';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabasePublicKey = import.meta.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabasePublicKey);


export function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
            if (data.user){
                redirect()
            }
        }
    }

    return(
        <>
            <LoginForm email={email} password={password} handleEmailChange={handleEmailChange}/>
        </>
    )
}