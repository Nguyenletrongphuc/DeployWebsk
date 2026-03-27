import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/common/Navbar';
import '../events/Events.css';
import '../auth/Auth.css';

export default function EventFormPage() {
  const { id } = useParams(); // id exists = edit mode
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    startDate: '', endDate: '', maxCapacity: 0,
    status: 'DRAFT', tagsInput: ''
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      axiosInstance.get(`/events/${id}`).then(({ data }) => {
        const e = data.event;
        setForm({
          title: e.title || '',
          description: e.description || '',
          location: e.location || '',
          startDate: e.startDate ? e.startDate.substring(0, 16) : '',
          endDate: e.endDate ? e.endDate.substring(0, 16) : '',
          maxCapacity: e.maxCapacity || 0,
          status: e.status || 'DRAFT',
          tagsInput: (e.tags || []).join(', ')
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (bannerFile) fd.append('bannerFile', bannerFile);
    try {
      if (id) {
        await axiosInstance.put(`/organizer/events/${id}`, fd);
      } else {
        await axiosInstance.post('/organizer/events', fd);
      }
      navigate('/organizer/my-events');
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="form-card">
          <h2>{id ? '✏️ Chỉnh sửa sự kiện' : '🎪 Tạo sự kiện mới'}</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tiêu đề *</label>
              <input type="text" value={form.title} onChange={f('title')} placeholder="Tên sự kiện" required />
            </div>
            <div className="form-group">
              <label>Mô tả *</label>
              <textarea value={form.description} onChange={f('description')} placeholder="Mô tả sự kiện..." required />
            </div>
            <div className="form-group">
              <label>Địa điểm *</label>
              <input type="text" value={form.location} onChange={f('location')} placeholder="Địa chỉ tổ chức" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ngày bắt đầu</label>
                <input type="datetime-local" value={form.startDate} onChange={f('startDate')} />
              </div>
              <div className="form-group">
                <label>Ngày kết thúc</label>
                <input type="datetime-local" value={form.endDate} onChange={f('endDate')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Số chỗ tối đa (0 = không giới hạn)</label>
                <input type="number" min="0" value={form.maxCapacity} onChange={f('maxCapacity')} />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select value={form.status} onChange={f('status')}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Tags (cách nhau bởi dấu phẩy)</label>
              <input type="text" value={form.tagsInput} onChange={f('tagsInput')} placeholder="music, entertainment, tech" />
            </div>
            <div className="form-group">
              <label>Ảnh bìa (Banner)</label>
              <input type="file" accept="image/*" style={{ color: 'rgba(255,255,255,0.7)' }}
                onChange={e => setBannerFile(e.target.files[0])} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Đang lưu...' : id ? 'Cập nhật' : 'Tạo sự kiện'}
              </button>
              <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Hủy</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
