import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─────────────────────────────────────────
// MOCK DATA (麵線專賣店範例)
// ─────────────────────────────────────────
const STORES = [
  { id: 1, name: "中央廚房", type: "warehouse", color: "#f97316" },
  { id: 2, name: "士捷分店", type: "branch", color: "#3b82f6" },
  { id: 3, name: "石牌分店", type: "branch", color: "#8b5cf6" },
  { id: 4, name: "旗艦分店", type: "branch", color: "#10b981" },
];

const INITIAL_PRODUCTS = [
  { id: 1, name: "滷製大腸 (5斤/包)", sku: "INT-001", unit: "包", quantity: 18, threshold: 20, avgCost: 850, supplier: "阿宏豬肉批發" },
  { id: 2, name: "東石蚵仔 (特大)", sku: "OYSTER-XL", unit: "斤", quantity: 45, threshold: 50, avgCost: 180, supplier: "嘉義布袋水產" },
  { id: 3, name: "手工生麵線", sku: "NOODLE-RAW", unit: "捆", quantity: 120, threshold: 100, avgCost: 45, supplier: "石碇許家麵線" },
  { id: 4, name: "新鮮魷魚丁", sku: "SQUID-DICE", unit: "斤", quantity: 32, threshold: 30, avgCost: 220, supplier: "南方澳海產行" },
  { id: 5, name: "現切花枝塊", sku: "SQUID-CHUNK", unit: "斤", quantity: 28, threshold: 40, avgCost: 260, supplier: "南方澳海產行" },
  { id: 6, name: "頂級柴魚片 (500g)", sku: "BONITO-500", unit: "包", quantity: 12, threshold: 15, avgCost: 350, supplier: "台東鰹魚工場" },
];

// 模擬分店詳細庫存 (ID 1=中廚, 2=士捷...)
const STORE_INVENTORY = {
  1: [ { id: 1, quantity: 12 }, { id: 2, quantity: 30 }, { id: 6, quantity: 8 } ],
  2: [ { id: 1, quantity: 3 }, { id: 2, quantity: 5 }, { id: 3, quantity: 40 } ], // 士捷 大腸與蚵仔低於水位
  3: [ { id: 4, quantity: 10 }, { id: 5, quantity: 8 } ], // 石牌 花枝低於水位
  4: [ { id: 3, quantity: 60 } ]
};

const TREND_DATA = [
  { date: "04/23", 中央廚房: 450, 士捷: 85, 石牌: 72, 旗艦: 95 },
  { date: "04/24", 中央廚房: 420, 士捷: 90, 石牌: 78, 旗艦: 88 },
  { date: "04/25", 中央廚房: 480, 士捷: 75, 石牌: 95, 旗艦: 110 },
  { date: "04/26", 中央廚房: 400, 士捷: 110, 石牌: 85, 旗艦: 92 },
  { date: "04/27", 中央廚房: 380, 士捷: 105, 石牌: 80, 旗艦: 105 },
  { date: "04/28", 中央廚房: 350, 士捷: 95, 石牌: 70, 旗艦: 115 },
  { date: "04/29", 中央廚房: 320, 士捷: 88, 石牌: 90, 旗艦: 102 },
];

const BRANCH_USAGE = [
  { name: "士捷分店", value: 648, fill: "#3b82f6" },
  { name: "石牌分店", value: 570, fill: "#8b5cf6" },
  { name: "旗艦分店", value: 727, fill: "#10b981" },
];

const isLowStock = (p) => p.quantity < p.threshold;
const fmtCurrency = (n) => `NT$ ${n.toLocaleString()}`;

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px", position: "relative" }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ color: "#94a3b8", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ color: accent || "#f1f5f9", fontSize: 24, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StockBadge({ qty, threshold }) {
  const pct = qty / threshold;
  const color = pct < 0.5 ? "#ef4444" : pct < 1 ? "#f59e0b" : "#10b981";
  return (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
      {pct < 0.5 ? "量極低" : pct < 1 ? "低水位" : "充足"}
    </span>
  );
}

function App() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [products] = useState(INITIAL_PRODUCTS);

  const stats = useMemo(() => {
    const lowStockCount = products.filter(isLowStock).length;
    const totalValue = products.reduce((acc, p) => acc + p.quantity * p.avgCost, 0);
    return { lowStockCount, totalValue, totalItems: products.length };
  }, [products]);

  // 檢查分店是否有低庫存品項
  const getStoreAlerts = (storeId) => {
    const items = STORE_INVENTORY[storeId] || [];
    return items.filter(si => {
      const p = products.find(prod => prod.id === si.id);
      return p && si.quantity < p.threshold / 2; // 分店水位通常更低
    }).length;
  };

  const navStyle = (t) => ({
    padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: activeTab === t ? "rgba(249,115,22,0.15)" : "transparent",
    border: "none", color: activeTab === t ? "#f97316" : "#64748b"
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#f1f5f9", fontFamily: "system-ui" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d1117", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🍜</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>阿輝麵線庫存</div>
            <div style={{ fontSize: 9, color: "#475569" }}>AHUI NOODLE MGMT</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          {[["overview", "📊 總覽"], ["inventory", "📦 食材"], ["reports", "📈 報表"], ["stores", "🏬 分店"]].map(([t, l]) => (
            <button key={t} onClick={() => setActiveTab(t)} style={navStyle(t)}>{l}</button>
          ))}
        </nav>
        <button onClick={() => setIsAdmin(!isAdmin)} style={{ background: "transparent", border: `1px solid ${isAdmin ? "#10b981" : "#f97316"}`, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: isAdmin ? "#10b981" : "#f97316", cursor: "pointer" }}>
          {isAdmin ? "🔒 管理者" : "🚚 運輸人員"}
        </button>
      </header>

      <main style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${isAdmin ? 4 : 3}, 1fr)`, gap: 16 }}>
              <StatCard label="食材品項" value={stats.totalItems} icon="🦑" />
              {isAdmin && <StatCard label="庫存估值" value={fmtCurrency(stats.totalValue)} icon="💰" accent="#10b981" />}
              <StatCard label="嚴重缺貨" value={stats.lowStockCount} icon="🚨" accent="#ef4444" />
              <StatCard label="物流狀態" value="正常" icon="🚚" accent="#3b82f6" />
            </div>
            
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📈 分店消耗趨勢</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={TREND_DATA}><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="中央廚房" stroke="#f97316" /><Line type="monotone" dataKey="士捷" stroke="#3b82f6" /><Line type="monotone" dataKey="旗艦" stroke="#10b981" /></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                  <th style={{ padding: 16 }}>食材名稱</th>
                  <th>現有庫存</th>
                  <th>安全水位</th>
                  {isAdmin && <th>成本</th>}
                  {isAdmin && <th>總估值</th>}
                  <th style={{ padding: 16 }}>狀態</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: 16 }}>{p.name}</td>
                    <td style={{ fontWeight: 700 }}>{p.quantity} {p.unit}</td>
                    <td style={{ color: "#64748b" }}>{p.threshold} {p.unit}</td>
                    {isAdmin && <td>{fmtCurrency(p.avgCost)}</td>}
                    {isAdmin && <td>{fmtCurrency(p.quantity * p.avgCost)}</td>}
                    <td style={{ padding: 16 }}><StockBadge qty={p.quantity} threshold={p.threshold} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reports" && (
          <div style={{ background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>📊 分店備貨比例圖</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={BRANCH_USAGE}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" radius={[5, 5, 0, 0]}>{BRANCH_USAGE.map((entry, index) => <Cell key={index} fill={entry.fill} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === "stores" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {STORES.map(s => {
              const alerts = getStoreAlerts(s.id);
              return (
                <div key={s.id} style={{ background: "rgba(255,255,255,0.03)", border: alerts > 0 ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, position: "relative" }}>
                  {alerts > 0 && <span style={{ position: "absolute", top: 16, right: 16, background: "#ef4444", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>🚨 需補貨 ({alerts})</span>}
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width:10, height: 10, borderRadius: "50%", background: s.color }} /> {s.name}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: "#64748b" }}>本週進貨</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>142 斤</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: "#64748b" }}>食材種類</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>6 項</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
export default App;
