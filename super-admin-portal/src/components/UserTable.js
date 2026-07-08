import React from 'react';
import '../styles/UserTable.css';

const UserTable = ({ users }) => {
  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Tenant</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users && users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id}>
                <td className="user-name">{user.name}</td>
                <td className="user-email">{user.email}</td>
                <td className="user-tenant">{user.tenantName}</td>
                <td className="user-role">{user.role}</td>
                <td>
                  <span className={`status-badge status-${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td className="user-actions">
                  <button className="action-btn view">View</button>
                  <button className="action-btn edit">Edit</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="no-data">No users found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
