import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import LoginForm from './LoginForm';

interface AuthWrapperProps {
	children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
	const { loggedIn } = useAdmin();
	
	if (!loggedIn) {
		return <LoginForm />;
	}
	
	return <>{children}</>;
};

export default AuthWrapper;