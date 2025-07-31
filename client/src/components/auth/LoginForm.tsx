import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

interface LoginFormProps {
	onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
	const { loginForm, setLoginForm, login, loading, error } = useAdmin();

	const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4'>
			<div className='max-w-md w-full space-y-8'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-bold text-gray-900'>
						Admin Login
					</h2>
					<p className='mt-2 text-center text-sm text-gray-600'>
						Sign in to access the admin dashboard
					</p>
				</div>
				<form className='mt-8 space-y-6' onSubmit={login}>
					<div className='rounded-md shadow-sm space-y-4'>
						<div>
							<label
								htmlFor='username'
								className='block text-sm font-medium text-gray-700'
							>
								Username
							</label>
							<input
								id='username'
								name='username'
								type='text'
								required
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
								placeholder='Enter your username'
								value={loginForm.username}
								onChange={handleLoginChange}
							/>
						</div>
						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700'
							>
								Password
							</label>
							<input
								id='password'
								name='password'
								type='password'
								required
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
								placeholder='Enter your password'
								value={loginForm.password}
								onChange={handleLoginChange}
							/>
						</div>
					</div>

					{error && (
						<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
							{error}
						</div>
					)}

					<div>
						<button
							type='submit'
							disabled={loading}
							className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{loading ? 'Signing in...' : 'Sign in'}
						</button>
					</div>

					{onSwitchToRegister && (
						<div className='text-center'>
							<button
								type='button'
								onClick={onSwitchToRegister}
								className='text-blue-600 hover:text-blue-500 text-sm font-medium'
							>
								Don&apos;t have an account? Register here
							</button>
						</div>
					)}
				</form>
			</div>
		</div>
	);
};

export default LoginForm;
