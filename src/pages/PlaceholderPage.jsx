import TopBar from '../components/TopBar';

export default function PlaceholderPage({ title, Icon }) {
  return (
    <div className="page-layout">
      <TopBar title={title} />
      <div className="page-content">
        <div className="empty-state">
          {Icon && <Icon size={48} />}
          <p>{title} — coming soon</p>
        </div>
      </div>
    </div>
  );
}
