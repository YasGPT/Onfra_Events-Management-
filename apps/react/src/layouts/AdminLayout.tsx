// Admin sidebar/header layout
import React from 'react';

export interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
};

export default AdminLayout;
