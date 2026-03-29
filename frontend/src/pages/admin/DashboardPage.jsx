import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/common/Navbar';
import '../events/Events.css';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // 'overview' | 'revenue'

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/admin/dashboard'),
      axiosInstance.get('/admin/revenue'),
    ]).then(([statsRes, revRes]) => {
      setStats(statsRes.data);
      setRevenue(revRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <><Navbar /><div className="loading-state">⏳ Đang tải thống kê...</div></>;

  const tabStyle = (key) => ({
    padding: '0.5rem 1.4rem',
    borderRadius: '20px',
    border: `1px solid ${tab === key ? '#6c63ff' : 'rgba(255,255,255,0.15)'}`,
    background: tab === key ? 'rgba(108,99,255,0.2)' : 'transparent',
    color: tab === key ? '#a78bfa' : 'rgba(255,255,255,0.6)',
    cursor: 'pointer', fontWeight: tab === key ? 700 : 400,
    transition: 'all 0.2s', fontSize: '0.9rem'
  });

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">📊 Dashboard Quản trị</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button style={tabStyle('overview')} onClick={() => setTab('overview')}>📈 Tổng quan</button>
          <button style={tabStyle('revenue')} onClick={() => setTab('revenue')}>💰 Doanh thu</button>
        </div>

        {tab === 'overview' && (
          <>
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
          </>
        )}

        {tab === 'revenue' && (
          <>
            {/* Tổng doanh thu */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem', marginBottom: '2rem'
            }}>
              <div className="stat-card" style={{ borderColor: 'rgba(167,139,250,0.3)' }}>
                <div className="stat-icon">💰</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                  {revenue?.totalRevenue?.toLocaleString('vi-VN') ?? 0}đ
                </div>
                <div className="stat-label">Tổng doanh thu</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎫</div>
                <div className="stat-value">
                  {(revenue?.revenueByEvent || []).reduce((s, e) => s + e.ticketsSold, 0)}
                </div>
                <div className="stat-label">Tổng vé đã bán</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-value">{(revenue?.revenueByEvent || []).length}</div>
                <div className="stat-label">Sự kiện có doanh thu</div>
              </div>
            </div>

            {/* Bảng doanh thu theo event */}
            {revenue?.revenueByEvent?.length > 0 ? (
              <>
                <h2 style={{ color: '#fff', marginBottom: '1rem' }}>📊 Doanh thu theo sự kiện</h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sự kiện</th>
                      <th>Vé đã bán</th>
                      <th>Số đơn</th>
                      <th>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.revenueByEvent.map((ev, i) => (
                      <tr key={ev.eventId}>
                        <td>{i + 1}</td>
                        <td><strong style={{ color: '#fff' }}>{ev.eventTitle}</strong></td>
                        <td>{ev.ticketsSold}</td>
                        <td>{ev.bookingCount}</td>
                        <td>
                          <span style={{ color: '#a78bfa', fontWeight: 700 }}>
                            {ev.revenue?.toLocaleString('vi-VN')}đ
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">💸 Chưa có doanh thu nào</div>
            )}
          </>
        )}
      </div>
    </>
  );
}
