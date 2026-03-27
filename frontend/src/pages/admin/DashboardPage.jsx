import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/common/Navbar';
import '../events/Events.css';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <><Navbar /><div className="loading-state">⏳ Đang tải thống kê...</div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">📊 Dashboard Quản trị</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{stats?.totalEvents ?? 0}</div>
            <div className="stat-label">Tổng sự kiện</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats?.publishedEvents ?? 0}</div>
            <div className="stat-label">Đã xuất bản</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats?.totalUsers ?? 0}</div>
            <div className="stat-label">Người dùng</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎟</div>
            <div className="stat-value">{stats?.totalRegistrations ?? 0}</div>
            <div className="stat-label">Lượt đăng ký</div>
          </div>
        </div>

        {stats?.top5Events?.length > 0 && (
          <>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>🔥 Top 5 sự kiện đông nhất</h2>
            <table className="data-table" style={{ marginBottom: '2rem' }}>
              <thead>
                <tr><th>#</th><th>Tên sự kiện</th><th>Địa điểm</th><th>Số tham dự</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {stats.top5Events.map((e, i) => (
                  <tr key={e.id}>
                    <td>{i + 1}</td>
                    <td><strong style={{ color: '#fff' }}>{e.title}</strong></td>
                    <td>{e.location}</td>
                    <td>{e.currentAttendees}</td>
                    <td><span className={`event-status-tag status-${e.status?.toLowerCase()}`} style={{ position: 'static' }}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
