// Login layout
import React from 'react';

export interface AuthLayoutProps {
  children?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
};

export default AuthLayout;
