import {LoginForm} from './components/login-form.jsx';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from "@/lib/supabaseClient.js";


export function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function handleEmailChange(e){
        setEmail(e.target.value);
    }

    function handlePasswordChange(e){
        setPassword(e.target.value);
    }

    async function signIn(e){
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error, data } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });


            setLoading(false);

        } catch(error){
            setError(error.message)
            setLoading(false);
            return;
        }

        setLoading(false);
        navigate('/app');
    }

    return(
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm
                    email={email}
                    password={password}
                    handleEmailChange={handleEmailChange}
                    handlePasswordChange={handlePasswordChange}
                    onSubmit={signIn}
                    error={error}
                    loading={loading}
                />
            </div>
        </div>
    );
}