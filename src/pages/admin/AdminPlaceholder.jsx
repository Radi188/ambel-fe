export default function AdminPlaceholder({ title, Icon }) {
  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">{title}</h1>
        </div>
      </div>
      <div className="admin-content">
        <div className="empty-state">
          {Icon && <Icon size={48} />}
          <p>{title} — coming soon</p>
        </div>
      </div>
    </div>
  );
}
