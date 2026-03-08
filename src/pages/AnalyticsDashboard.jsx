import React, { useState, useEffect, useCallback } from "react";
import {
  fetchAnalyticsSummary, fetchAnalyticsItems, fetchAnalyticsFunnel,
  fetchAnalyticsSearches, fetchAnalyticsHourly, fetchAnalyticsDaily, fetchAllMenuItems
} from "../lib/api";
import "./dashboard.css";

// ─── Micro-components ────────────────────────────────────
const KPICard = ({ icon, label, value, subtext, color }) => (
  <div className="kpi-card" style={{ "--accent": color }}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-label">{label}</div>
    {subtext && <div className="kpi-subtext">{subtext}</div>}
  </div>
);

const BarChart = ({ data, valueKey, labelKey, color, height = 180 }) => {
  if (!data || data.length === 0) return <div className="empty-chart">No data yet</div>;
  const max = Math.max(...data.map((d) => d[valueKey])) || 1;
  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div className="bar" style={{ height: `${(d[valueKey] / max) * 100}%`, background: color || "var(--gradient-primary)" }}>
            <span className="bar-tooltip">{d[valueKey]}</span>
          </div>
          <span className="bar-label">{d[labelKey]}</span>
        </div>
      ))}
    </div>
  );
};

const FunnelChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="empty-chart">No funnel data yet</div>;
  return (
    <div className="funnel-chart">
      {data.map((step, i) => (
        <div key={i} className="funnel-step">
          <div className="funnel-bar-wrap">
            <div className="funnel-bar" style={{ width: `${Math.max(step.pct, 3)}%` }}>
              <span className="funnel-count">{step.count.toLocaleString()}</span>
            </div>
          </div>
          <div className="funnel-info">
            <span className="funnel-stage">{step.stage}</span>
            <span className="funnel-pct">{step.pct}%</span>
          </div>
          {i < data.length - 1 && data[i].count > 0 && (
            <div className="funnel-drop">
              ↓ {(((data[i].count - data[i + 1].count) / data[i].count) * 100).toFixed(0)}% drop
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ItemTable = ({ items }) => {
  if (!items || items.length === 0) return <div className="empty-chart">No item analytics yet. User interactions will appear here.</div>;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th><th>Category</th><th>Views</th><th>3D</th><th>AR</th><th>Cart</th><th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="item-name-cell">{item.item_name || `Item #${item.item_id}`}</td>
              <td><span className={`cat-badge cat-${(item.item_category || '').replace(/\s/g, "").toLowerCase()}`}>{item.item_category}</span></td>
              <td>{item.views || 0}</td>
              <td>{item.views_3d || 0}</td>
              <td>{item.views_ar || 0}</td>
              <td className="highlight-cell">{item.cart_adds || 0}</td>
              <td className="revenue-cell">₹{(item.revenue || 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [itemAnalytics, setItemAnalytics] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [searches, setSearches] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  const daysMap = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[timeRange] || 7;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, items, f, sr, h, d, mi] = await Promise.all([
        fetchAnalyticsSummary(days),
        fetchAnalyticsItems(days),
        fetchAnalyticsFunnel(days),
        fetchAnalyticsSearches(days),
        fetchAnalyticsHourly(days),
        fetchAnalyticsDaily(days),
        fetchAllMenuItems(),
      ]);
      setSummary(s);
      setItemAnalytics(items);
      setFunnel(f);
      setSearches(sr);
      setHourly(h.map(r => ({ ...r, label: `${String(r.hour).padStart(2, "0")}:00` })));
      setDaily(d);
      setMenuItems(mi);
    } catch (e) {
      console.error("Analytics load error:", e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadData(); }, [loadData]);

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "items", label: "🍽️ Items" },
    { id: "funnel", label: "🔄 Funnel" },
    { id: "time", label: "⏰ Time" },
    { id: "search", label: "🔍 Search" },
  ];

  const convRate = summary && summary.menu_opens > 0
    ? ((summary.cart_adds / summary.menu_opens) * 100).toFixed(1)
    : "0";

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div>
            <h1 className="dash-title">Analytics Dashboard</h1>
            <p className="dash-subtitle">
              Real-Time 3DMenu Performance — {summary?.total_events || 0} total events tracked
            </p>
          </div>
        </div>
        <div className="dash-header-right">
          <div className="time-range-selector">
            {["24h", "7d", "30d", "90d"].map((t) => (
              <button key={t} className={`time-btn ${timeRange === t ? "active" : ""}`} onClick={() => setTimeRange(t)}>{t}</button>
            ))}
          </div>
          <button onClick={loadData} className="posthog-link" style={{ cursor: "pointer", border: "none" }}>↻ Refresh</button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="dash-tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={`dash-tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </nav>

      {/* Content */}
      <div className="dash-content">
        {loading ? (
          <div className="dash-loading">Loading real analytics...</div>
        ) : (
          <>
            {activeTab === "overview" && summary && (
              <>
                <div className="kpi-grid">
                  <KPICard icon="👁️" label="Menu Opens" value={summary.menu_opens?.toLocaleString() || 0} color="#6366f1" />
                  <KPICard icon="👤" label="Unique Sessions" value={summary.unique_sessions?.toLocaleString() || 0} color="#8b5cf6" />
                  <KPICard icon="🛒" label="Cart Adds" value={summary.cart_adds || 0} color="#10b981" />
                  <KPICard icon="💰" label="Revenue" value={`₹${(summary.total_revenue || 0).toLocaleString()}`} color="#f59e0b" />
                  <KPICard icon="📈" label="Conversion" value={`${convRate}%`} color="#ef4444" subtext="Opens → Cart" />
                  <KPICard icon="🔍" label="Searches" value={summary.searches || 0} color="#06b6d4" />
                  <KPICard icon="🧊" label="3D Views" value={summary.model_3d_views || 0} color="#a855f7" />
                  <KPICard icon="📱" label="AR Views" value={summary.ar_starts || 0} color="#ec4899" />
                </div>
                <div className="section-grid-2">
                  <div className="dash-card">
                    <h3 className="card-title">🔄 Conversion Funnel</h3>
                    <FunnelChart data={funnel} />
                  </div>
                  <div className="dash-card">
                    <h3 className="card-title">🏆 Top Items by Cart</h3>
                    <BarChart data={itemAnalytics.slice(0, 6)} valueKey="cart_adds" labelKey="item_name" color="linear-gradient(180deg, #10b981, #059669)" />
                  </div>
                </div>
              </>
            )}

            {activeTab === "items" && (
              <>
                {/* Item filter dropdown */}
                <div className="dash-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <h3 className="card-title" style={{ margin: 0 }}>🍽️ Per-Item Analytics</h3>
                    <select
                      value={selectedItem || ""}
                      onChange={e => setSelectedItem(e.target.value || null)}
                      className="time-btn active"
                      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--dash-border)", background: "var(--dash-surface-2)", color: "var(--dash-text)", fontSize: 13 }}
                    >
                      <option value="">All Items</option>
                      {menuItems.map(mi => (
                        <option key={mi.id} value={mi.id}>{mi.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="dash-card">
                  <ItemTable items={selectedItem ? itemAnalytics.filter(i => String(i.item_id) === String(selectedItem)) : itemAnalytics} />
                </div>
                <div className="section-grid-2">
                  <div className="dash-card">
                    <h3 className="card-title">📊 Views per Item</h3>
                    <BarChart data={itemAnalytics.slice(0, 8)} valueKey="views" labelKey="item_name" color="linear-gradient(180deg, #6366f1, #4f46e5)" />
                  </div>
                  <div className="dash-card">
                    <h3 className="card-title">💸 Revenue per Item</h3>
                    <BarChart data={itemAnalytics.slice(0, 8)} valueKey="revenue" labelKey="item_name" color="linear-gradient(180deg, #f59e0b, #d97706)" />
                  </div>
                </div>
              </>
            )}

            {activeTab === "funnel" && (
              <div className="dash-card">
                <h3 className="card-title">🔄 Full Conversion Funnel</h3>
                <p className="card-desc">Menu Open → Item View → 3D View → AR View → Add to Cart</p>
                <FunnelChart data={funnel} />
                {funnel.length > 0 && funnel[0].count > 0 && (
                  <div className="funnel-insights">
                    <h4>💡 Insights</h4>
                    <ul>
                      <li><strong>Overall conversion:</strong> {convRate}% of menu opens result in cart additions.</li>
                      {funnel[2]?.count > 0 && <li><strong>3D engagement:</strong> {funnel[2].count} users viewed 3D models ({funnel[2].pct}% of opens).</li>}
                      {funnel[3]?.count > 0 && <li><strong>AR activation:</strong> {funnel[3].count} users tried AR ({funnel[3].pct}% of opens).</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "time" && (
              <>
                <div className="dash-card">
                  <h3 className="card-title">⏰ Orders by Hour</h3>
                  <p className="card-desc">Peak ordering times for scheduling promotions</p>
                  <BarChart data={hourly} valueKey="orders" labelKey="label" color="linear-gradient(180deg, #6366f1, #4f46e5)" height={220} />
                </div>
                <div className="dash-card">
                  <h3 className="card-title">📅 Weekly Pattern</h3>
                  <BarChart data={daily} valueKey="orders" labelKey="day" color="linear-gradient(180deg, #ec4899, #db2777)" />
                </div>
              </>
            )}

            {activeTab === "search" && (
              <div className="dash-card">
                <h3 className="card-title">🔍 Top Searches</h3>
                <p className="card-desc">What users are searching for — discover demand!</p>
                {searches.length > 0 ? (
                  <div className="search-list">
                    {searches.map((s, i) => (
                      <div key={i} className="search-item">
                        <span className="search-rank">#{i + 1}</span>
                        <span className="search-query">"{s.query}"</span>
                        <div className="search-bar-bg">
                          <div className="search-bar-fill" style={{ width: `${(s.count / searches[0].count) * 100}%` }} />
                        </div>
                        <span className="search-count">{s.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-chart">No search data yet. Users will generate this as they search.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="dash-footer">
        <p>Powered by Cloudflare D1 · Real-time analytics · 3DMenu Admin v2.0</p>
      </footer>
    </div>
  );
};

export default AnalyticsDashboard;
