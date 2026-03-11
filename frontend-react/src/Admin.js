import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiChevronRight, FiDownload } from 'react-icons/fi';
import './App.css';



const Admin = () => {
  const navigate = useNavigate();
  const [usersData, setUsersData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('files'); // 'files' or 'activity'

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);


      // Redirect if not admin
      if (parsedUser.role !== 'admin') {
        alert('Access denied. Admin only.');
        navigate('/');
      }
    } else {
      // Not logged in
      navigate('/login');
    }
  }, [navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Using the new route to get all users
      const res = await axios.get(`http://localhost:5000/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The new route returns array of users directly
      setUsersData(res.data || []);

      if (res.data.length > 0) {
        setSelectedUser(res.data[0]);
        setActiveTab('files');
      }
    } catch (err) {
      console.error('Error loading users', err);
      setUsersData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);



  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--clr-charcoal)',
        borderBottom: '1px solid var(--clr-border)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--clr-oat)', margin: 0 }}>
            CampusLens Admin
          </h1>
          <p style={{ color: 'var(--clr-taupe)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Manage users and their uploads
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '20px',
        padding: '20px',
        maxWidth: '1600px',
        margin: '0 auto',
        height: 'calc(100vh - 120px)'
      }}>
        {/* Users List */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--clr-border)',
            background: 'rgba(35, 35, 35, 0.05)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--clr-charcoal)' }}>
              Users ({usersData.length})
            </h3>
          </div>

          <div style={{
            overflowY: 'auto',
            flex: 1,
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border-color) transparent'
          }}>
            {loading ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                Loading users...
              </div>
            ) : usersData.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                No users found
              </div>
            ) : (
              usersData.map((u) => (
                <button
                  key={u._id}
                  onClick={() => {
                    setSelectedUser(u);
                    setActiveTab('files');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: selectedUser?._id === u._id ? 'var(--clr-charcoal)' : 'transparent',
                    color: selectedUser?._id === u._id ? 'var(--clr-oat)' : 'var(--clr-charcoal)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--clr-border)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedUser?._id !== u._id) {
                      e.target.style.background = 'var(--bg-light)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedUser?._id !== u._id) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <FiUser size={16} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        opacity: 0.7,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {u.totalFiles} files
                      </div>
                    </div>
                  </div>
                  <FiChevronRight size={16} style={{ opacity: selectedUser?._id === u._id ? 1 : 0 }} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* User Details */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {selectedUser ? (
            <>
              {/* User Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {selectedUser.name}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {selectedUser.email}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Role: <span style={{ fontWeight: '600' }}>{selectedUser.role}</span>
                      <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                      Status: <span style={{
                        fontWeight: '600',
                        color: selectedUser.status === 'active' ? 'var(--clr-mocha)' : 'var(--clr-taupe)'
                      }}>
                        {selectedUser.status || 'active'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '20px' }}>

                  {/* Quick Stats - Enhanced UI */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      background: 'var(--card-bg)',
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                        {selectedUser.totalFiles}
                      </div>
                      <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                        Files Uploaded
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--card-bg)',
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--clr-primary)', marginBottom: '8px' }}>
                        {selectedUser.totalUploads}
                      </div>
                      <div style={{ fontSize: '1rem', color: 'var(--clr-mocha)', fontWeight: '500' }}>
                        Total Processed
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--card-bg)',
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
                        {selectedUser.totalDownloads}
                      </div>
                      <div style={{ fontSize: '1rem', color: 'var(--clr-mocha)', fontWeight: '500' }}>
                        Downloads
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--card-bg)',
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--clr-primary)', marginBottom: '8px' }}>
                        {selectedUser.loginSessions?.length || 0}
                      </div>
                      <div style={{ fontSize: '1rem', color: 'var(--clr-mocha)', fontWeight: '500' }}>
                        Login Sessions
                      </div>
                    </div>
                  </div>

                  {/* Signing Dates Section */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--card-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Joined
                      </p>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleTimeString() : ''}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Last Login
                      </p>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleTimeString() : ''}
                      </p>
                    </div>

                  </div>

                  {/* Actions */}
                  <div style={{
                    padding: '12px',
                    background: 'var(--card-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                    display: 'flex',
                    gap: '12px',
                    marginTop: '12px'
                  }}>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Are you sure you want to delete ${selectedUser.name}?`)) return;
                        try {
                          const token = localStorage.getItem('token');
                          await axios.delete(`http://localhost:5000/api/auth/users/${selectedUser._id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          alert('User deleted');
                          window.location.reload();
                        } catch (err) {
                          console.error('Delete error:', err.response?.data || err.message);
                          alert('Error deleting user: ' + (err.response?.data?.msg || err.message));
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      Delete User
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const newStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
                          const res = await axios.put(`http://localhost:5000/api/auth/users/${selectedUser._id}/status`,
                            { status: newStatus },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          setSelectedUser(prev => ({ ...prev, status: res.data.status }));
                          setUsersData(prev => prev.map(u => u._id === selectedUser._id ? { ...u, status: res.data.status } : u));
                        } catch (err) {
                          alert('Error updating status');
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        background: selectedUser.status === 'active' ? 'var(--clr-mocha)' : 'var(--clr-charcoal)',
                        color: selectedUser.status === 'active' ? 'var(--clr-oat)' : 'var(--clr-oat)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      {selectedUser.status === 'active' ? 'Deactivate User' : 'Activate User'}
                    </button>
                  </div>
                  {/* Files and Activity Tabs */}
                  <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-light)'
                  }}>
                    <button
                      onClick={() => setActiveTab('files')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: activeTab === 'files' ? 'var(--card-bg)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'files' ? '2px solid var(--accent-primary)' : 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: activeTab === 'files' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Uploads ({selectedUser.totalFiles})
                    </button>
                    <button
                      onClick={() => setActiveTab('activity')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: activeTab === 'activity' ? 'var(--card-bg)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'activity' ? '2px solid var(--accent-primary)' : 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: activeTab === 'activity' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Activity ({selectedUser.loginSessions?.length || 0})
                    </button>
                  </div>

                  {/* Files List */}
                  {activeTab === 'files' && (
                    <div style={{
                      // Removing overflowY and flex to let parent scroll
                    }}>
                      {selectedUser.totalFiles === 0 ? (
                        <div style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: 'var(--text-muted)'
                        }}>
                          <p>No uploads yet</p>
                        </div>
                      ) : (
                        <div style={{ padding: '12px' }}>
                          {(selectedUser.files || []).map((file) => (
                            <div
                              key={file._id}
                              style={{
                                padding: '12px',
                                background: 'var(--bg-light)',
                                borderRadius: '8px',
                                marginBottom: '8px',
                                border: '1px solid var(--border-color)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '8px'
                              }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4 style={{
                                    margin: '0 0 4px 0',
                                    color: 'var(--text-main)',
                                    fontWeight: '600',
                                    wordBreak: 'break-word',
                                    fontSize: '0.95rem'
                                  }}>
                                    {file.fileName}
                                  </h4>
                                  <p style={{
                                    margin: 0,
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem'
                                  }}>
                                    Uploaded: {new Date(file.lastUploadedAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '8px'
                              }}>
                                <div style={{
                                  background: 'var(--card-bg)',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--clr-taupe)' }}>
                                    ⬆️ {file.uploadCount}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Uploads
                                  </div>
                                </div>
                                <div style={{
                                  background: 'var(--card-bg)',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#3b82f6' }}>
                                    <FiDownload style={{ display: 'inline', marginRight: '4px' }} />
                                    {file.downloadCount}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Downloads
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activity (Login/Signup) List */}
                  {activeTab === 'activity' && (
                    <div style={{
                      // Removing overflowY and flex to let parent scroll
                    }}>
                      {!selectedUser.loginSessions || selectedUser.loginSessions.length === 0 ? (
                        <div style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: 'var(--text-muted)'
                        }}>
                          <p>No login activity yet</p>
                        </div>
                      ) : (
                        <div style={{ padding: '12px' }}>
                          {(selectedUser.loginSessions || []).map((session, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '12px',
                                background: session.type === 'signup' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-light)',
                                borderRadius: '8px',
                                marginBottom: '8px',
                                border: '1px solid ' + (session.type === 'signup' ? 'var(--clr-primary)33' : 'var(--clr-border)'),
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = session.type === 'signup' ? '#10b98133' : 'var(--border-color)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                              }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: session.type === 'signup' ? 'var(--clr-taupe)' : 'var(--clr-mocha)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  flexShrink: 0
                                }}>
                                  {session.type === 'signup' ? '✓' : '→'}
                                </div>
                                <div>
                                  <h4 style={{
                                    margin: 0,
                                    color: 'var(--text-main)',
                                    fontWeight: '600',
                                    fontSize: '0.95rem'
                                  }}>
                                    {session.type === 'signup' ? 'Account Created' : 'Signed In'}
                                  </h4>
                                  <p style={{
                                    margin: '2px 0 0 0',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem'
                                  }}>
                                    {new Date(session.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {session.ipAddress && (
                                <p style={{
                                  margin: '8px 0 0 36px',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.8rem'
                                }}>
                                  IP: {session.ipAddress}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)'
            }}>
              {loading ? 'Loading...' : 'Select a user to view details'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
