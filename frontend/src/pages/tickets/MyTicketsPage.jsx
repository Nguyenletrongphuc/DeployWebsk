import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/common/Navbar';
import '../events/Events.css';

export default function MyRegistrationsPage() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchRegs = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/my-registrations');
      setRegs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRegs(); }, []);

  const handleCancel = async (regId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đăng ký không?')) return;
    try {
      await axiosInstance.delete(`/registrations/${regId}`);
      setMsg('Đã hủy đăng ký thành công');
      fetchRegs();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Hủy thất bại');
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">🎟 Đăng ký của tôi</h1>
        {msg && <div className="msg-box success" style={{ marginBottom: '1rem' }}>{msg}</div>}
        {loading ? <div className="loading-state">⏳ Đang tải...</div>
          : regs.length === 0 ? <div className="empty-state">😔 Bạn chưa đăng ký sự kiện nào</div>
          : (
            <div className="reg-grid">
              {regs.map(r => (
                <div key={r.id} className="reg-card">
                  <h4>{r.eventTitle || 'Sự kiện'}</h4>
                  <p className="event-meta">📍 {r.eventLocation || '—'}</p>
                  <p className="event-meta">📅 {r.eventStartDate ? new Date(r.eventStartDate).toLocaleDateString('vi-VN') : '—'}</p>
                  <p className="event-meta">Ngày đăng ký: {r.registeredAt ? new Date(r.registeredAt).toLocaleDateString('vi-VN') : '—'}</p>
                  <p className={`reg-status-${r.status?.toLowerCase()}`}>⚡ {r.status}</p>
                  {r.status === 'CONFIRMED' && (
                    <button className="btn-sm btn-danger" style={{ marginTop: '0.75rem' }}
                      onClick={() => handleCancel(r.id)}>Hủy đăng ký</button>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  );
}
