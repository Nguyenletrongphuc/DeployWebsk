import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/common/Navbar';
import '../events/Events.css';

export default function UserManagePage() {
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [filters, setFilters] = useState({ keyword: '', role: '', page: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchUsers = async (f = filters) => {
    setLoading(true);
    try {
      const params = { ...f };
      Object.keys(params).forEach(k => !params[k] && params[k] !== 0 && delete params[k]);
      const { data: res } = await axiosInstance.get('/admin/users', { params });
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggle = async (id) => {
    try {
      await axiosInstance.post(`/admin/users/${id}/toggle`);
      setMsg({ text: 'Đã cập nhật trạng thái tài khoản', type: 'success' });
      fetchUsers();
    } catch { setMsg({ text: 'Thao tác thất bại', type: 'error' }); }
  };

  const handleRole = async (id, role) => {
    try {
      await axiosInstance.post(`/admin/users/${id}/role`, null, { params: { role } });
      setMsg({ text: 'Đã đổi quyền thành công', type: 'success' });
      fetchUsers();
    } catch { setMsg({ text: 'Thao tác thất bại', type: 'error' }); }
  };

  const search = (e) => { e.preventDefault(); const nf = { ...filters, page: 0 }; setFilters(nf); fetchUsers(nf); };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">👥 Quản lý người dùng</h1>
        {msg.text && <div className={`msg-box ${msg.type}`} style={{ marginBottom: '1rem' }}>{msg.text}</div>}
        <form className="filter-bar" onSubmit={search} style={{ marginBottom: '1.5rem' }}>
          <input className="filter-input" placeholder="🔍 Tìm tên, email..." value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
          <select className="filter-select" value={filters.role}
            onChange={e => setFilters({ ...filters, role: e.target.value })}>
            <option value="">Tất cả quyền</option>
            <option value="ATTENDEE">ATTENDEE</option>
            <option value="ORGANIZER">ORGANIZER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button className="filter-btn" type="submit">Tìm kiếm</button>
        </form>

        {loading ? <div className="loading-state">⏳ Đang tải...</div>
          : data.content.length === 0 ? <div className="empty-state">Không có người dùng nào</div>
          : (
            <table className="data-table">
              <thead>
                <tr><th>Họ tên</th><th>Email</th><th>Quyền</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {data.content.map(u => (
                  <tr key={u.id}>
                    <td><strong style={{ color: '#fff' }}>{u.fullName}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <select className="filter-select" style={{ padding: '0.3rem 0.5rem', minWidth: '120px' }}
                        value={u.role} onChange={e => handleRole(u.id, e.target.value)}>
                        <option value="ATTENDEE">ATTENDEE</option>
                        <option value="ORGANIZER">ORGANIZER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <span style={{ color: u.enabled ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
                        {u.enabled ? '✅ Hoạt động' : '🔒 Bị khóa'}
                      </span>
                    </td>
                    <td>
                      <button className={`btn-sm ${u.enabled ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggle(u.id)}>
                        {u.enabled ? '🔒 Khóa' : '🔓 Mở khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        {data.totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: data.totalPages }, (_, i) => (
              <button key={i} className={`page-btn ${i === filters.page ? 'active' : ''}`}
                onClick={() => { const nf = { ...filters, page: i }; setFilters(nf); fetchUsers(nf); }}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
