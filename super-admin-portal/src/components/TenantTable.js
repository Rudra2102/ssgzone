import React from 'react';
import '../styles/TenantTable.css';

const TenantTable = ({ tenants }) => {
  return (
    <div className="tenant-table-container">
      <table className="tenant-table">
        <thead>
          <tr>
            <th>Tenant Name</th>
            <th>Users</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants && tenants.length > 0 ? (
            tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="tenant-name">{tenant.name}</td>
                <td className="tenant-users">{tenant.userCount || 0}</td>
                <td>
                  <span className={`status-badge status-${tenant.status}`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="tenant-actions">
                  <button className="action-btn edit">Edit</button>
                  <button className="action-btn view">View</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="no-data">No tenants found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TenantTable;
