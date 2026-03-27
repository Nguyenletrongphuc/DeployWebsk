import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/common/Navbar';
import './Events.css';

export default function EventListPage() {
  const [data, setData] = useState({ content: [], totalPages: 0, allTags: [], allLocations: [] });
  const [filters, setFilters] = useState({ keyword: '', tag: '', location: '', dateFrom: '', dateTo: '', page: 0 });
  const [loading, setLoading] = useState(true);

  const fetchEvents = async (f = filters) => {
    setLoading(true);
    try {
      const params = { ...f };
      Object.keys(params).forEach(k => !params[k] && params[k] !== 0 && delete params[k]);
      const { data: res } = await axiosInstance.get('/events', { params });
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const newF = { ...filters, page: 0 };
    setFilters(newF);
    fetchEvents(newF);
  };

  const changePage = (p) => {
    const newF = { ...filters, page: p };
    setFilters(newF);
    fetchEvents(newF);
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="events-hero">
          <h1>Khám phá Sự kiện</h1>
          <p>Tìm kiếm và tham gia những sự kiện thú vị nhất</p>
        </div>

        {/* Filters */}
        <form className="filter-bar" onSubmit={handleSearch}>
          <input className="filter-input" placeholder="🔍 Tìm kiếm sự kiện..." value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
          <select className="filter-select" value={filters.tag}
            onChange={e => setFilters({ ...filters, tag: e.target.value })}>
            <option value="">Tất cả thẻ</option>
            {data.allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="filter-select" value={filters.location}
            onChange={e => setFilters({ ...filters, location: e.target.value })}>
            <option value="">Tất cả địa điểm</option>
            {data.allLocations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input className="filter-input" type="date" title="Từ ngày" value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
          <input className="filter-input" type="date" title="Đến ngày" value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })} />
          <button className="filter-btn" type="submit">Tìm kiếm</button>
        </form>

        {/* Events Grid */}
        {loading ? (
          <div className="loading-state">⏳ Đang tải sự kiện...</div>
        ) : data.content.length === 0 ? (
          <div className="empty-state">😔 Không có sự kiện nào phù hợp</div>
        ) : (
          <div className="events-grid">
            {data.content.map(event => (
              <Link to={`/events/${event.id}`} key={event.id} className="event-card">
                <div className="event-card-banner">
                  {event.bannerImagePath
                    ? <img src={`http://localhost:8080/uploads/${event.bannerImagePath}`} alt={event.title} />
                    : <div className="event-card-placeholder">🎪</div>}
                  <span className={`event-status-tag status-${event.status?.toLowerCase()}`}>{event.status}</span>
                </div>
                <div className="event-card-body">
                  <h3>{event.title}</h3>
                  <p className="event-meta">📍 {event.location}</p>
                  <p className="event-meta">📅 {event.startDate ? new Date(event.startDate).toLocaleDateString('vi-VN') : '—'}</p>
                  {event.tags?.length > 0 && (
                    <div className="event-tags">
                      {event.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  )}
                  <p className="event-spots">
                    {event.maxCapacity === 0
                      ? '✅ Không giới hạn chỗ'
                      : `🎟 ${event.maxCapacity - event.currentAttendees} chỗ còn trống / ${event.maxCapacity}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: data.totalPages }, (_, i) => (
              <button key={i} className={`page-btn ${i === filters.page ? 'active' : ''}`}
                onClick={() => changePage(i)}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
