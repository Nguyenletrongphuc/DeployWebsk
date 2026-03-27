import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import useAuthStore from '../../store/authStore';
import Navbar from '../../components/common/Navbar';
import './Events.css';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');

  useEffect(() => {
    axiosInstance.get(`/events/${id}`)
      .then(r => setData(r.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data: res } = await axiosInstance.post(`/events/${id}/register`);
      setMessage(res.message);
      setMsgType('success');
      setData(prev => ({ ...prev, alreadyRegistered: true, event: { ...prev.event, currentAttendees: prev.event.currentAttendees + 1 } }));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Đăng ký thất bại');
      setMsgType('error');
    }
  };

  if (loading) return <><Navbar /><div className="loading-state">⏳ Đang tải...</div></>;
  if (!data) return null;
  const { event, spotsLeft, alreadyRegistered } = data;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="event-detail">
          {event.bannerImagePath && (
            <img className="event-detail-banner"
              src={`http://localhost:8080/uploads/${event.bannerImagePath}`} alt={event.title} />
          )}
          <div className="event-detail-content">
            <div className="event-detail-header">
              <div>
                <span className={`event-status-tag status-${event.status?.toLowerCase()}`}>{event.status}</span>
                <h1>{event.title}</h1>
                <p className="event-meta">📍 {event.location}</p>
                <p className="event-meta">
                  📅 {new Date(event.startDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {event.endDate && ` → ${new Date(event.endDate).toLocaleDateString('vi-VN')}`}
                </p>
                <p className="event-meta">👤 Tổ chức: <strong>{event.organizerName}</strong></p>
              </div>
              <div className="event-detail-sidebar">
                <div className="spots-box">
                  <div className="spots-number">{spotsLeft === 2147483647 ? '∞' : spotsLeft}</div>
                  <div className="spots-label">Chỗ còn trống</div>
                </div>
                {message && <div className={`msg-box ${msgType}`}>{message}</div>}
                {event.status === 'PUBLISHED' && !alreadyRegistered && user?.role === 'ATTENDEE' && (
                  <button className="btn-register" onClick={handleRegister} disabled={spotsLeft === 0}>
                    {spotsLeft === 0 ? '❌ Hết chỗ' : '🎟 Đăng ký tham dự'}
                  </button>
                )}
                {alreadyRegistered && <div className="msg-box success">✅ Bạn đã đăng ký sự kiện này</div>}
                {!user && event.status === 'PUBLISHED' && (
                  <button className="btn-register" onClick={() => navigate('/login')}>🔐 Đăng nhập để đăng ký</button>
                )}
              </div>
            </div>
            <div className="event-detail-desc">
              <h3>Mô tả sự kiện</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>
            </div>
            {event.tags?.length > 0 && (
              <div className="event-tags">
                {event.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
