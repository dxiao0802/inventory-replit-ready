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
  { id: 1, name: "滷製大腸 (5台斤/包)", sku: "INT-001", unit: "包", quantity: 18, threshold: 20, avgCost: 850, supplier: "阿宏豬肉批發", supplierContact: "02-2345-6789" },
  { id: 2, name: "東石蚵仔 (特大)", sku: "OYSTER-XL", unit: "斤", quantity: 45, threshold: 50, avgCost: 180, supplier: "嘉義布袋水產", supplierContact: "05-1234-5678" },
  { id: 3, name: "手工生麵線", sku: "NOODLE-RAW", unit: "捆", quantity: 120, threshold: 100, avgCost: 45, supplier: "石碇許家麵線", supplierContact: "02-9876-5432" },
  { id: 4, name: "新鮮魷魚丁", sku: "SQUID-DICE", unit: "斤", quantity: 32, threshold: 30, avgCost: 220, supplier: "南方澳海產行", supplierContact: "03-8765-4321" },
  { id: 5, name: "現切花枝塊", sku: "SQUID-CHUNK", unit: "斤", quantity: 28, threshold: 40, avgCost: 260, supplier: "南方澳海產行", supplierContact: "03-8765-4321" },
  { id: 6, name: "頂級柴魚片 (500g)", sku: "BONITO-500", unit: "包", quantity: 12, threshold: 15, avgCost: 350, supplier: "台東鰹魚工場", supplierContact: "089-543210" },
];

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

const RECENT_TRANSACTIONS = [
  { id: 1, time: "14:32", type: "出貨", product: "滷製大腸 (5台斤/包)", qty: 5, from: "中央廚房", to: "士捷分店", operator: "阿輝" },
  { id: 2, time: "13:15", type: "進貨", product: "東石蚵仔 (特大)", qty: 20, from: "嘉義布袋水產", to: "中央廚房", operator: "系統" },
  { id: 3, time: "11:48", type: "出貨", product: "手工生麵線", qty: 30, from: "中央廚房", to: "旗艦分店", operator: "小李" },
  { id: 4, time: "10:20", type: "出貨", product: "頂級柴魚片 (500g)", qty: 3, from: "中央廚房", to: "石牌分店", operator: "阿明" },
  { id: 5, time: "09:05", type: "進貨", product: "新鮮魷魚丁", qty: 40, from: "南方澳海產行", to: "中央廚房", operator: "系統" },
];

const isLowStock = (p) => p.quantity < p.threshold;
const fmtCurrency = (n) => `NT$ ${n.toLocaleString()}`;

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ color: "#94a3b8", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ color: accent || "#f1f5f9", fontSize: 28, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      {sub && <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{sub}</div>}
      <div style={{ position: "absolute", right: -16, bottom: -16, width: 80, height: 80, borderRadius: "50%", background: `${accent || "#3b82f6"}18` }} />
    </div>
  );
}

function StockBadge({ qty, threshold }) {
  const pct = qty / threshold;
  const color = pct < 0.5 ? "#ef4444" : pct < 1 ? "#f59e0b" : "#10b981";
  const label = pct < 0.5 ? "量極低" : pct < 1 ? "低水位" : "充足";
  return (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
  );
}

function TransactionModal({ onClose, products, stores, onSubmit }) {
  const [form, setForm] = useState({ type: "outbound", productId: products[0]?.id || "", qty: "", fromStore: "1", toStore: "2", operator: "", note: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = () => {
    if (!form.qty || !form.operator) { alert("請填寫數量與操作人員"); return; }
    onSubmit(form); onClose();
  };
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#f1f5f9", padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 480, maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, margin: 0 }}>📋 新增食材調度</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["outbound", "🚚 配送分店"], ["inbound", "📦 食材補貨"]].map(([v, l]) => (
            <button key={v} onClick={() => set("type", v)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, background: form.type === v ? "#f97316" : "rgba(255,255,255,0.06)", border: `1px solid ${form.type === v ? "#f97316" : "rgba(255,255,255,0.1)"}`, color: form.type === v ? "#fff" : "#94a3b8" }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>食材品項 *</label>
            <select value={form.productId} onChange={e => set("productId", e.target.value)} style={inputStyle}>
              {products.map(p => <option key={p.id} value={p.id} style={{ background: "#1a1f2e" }}>{p.name} (庫存: {p.quantity}{p.unit})</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>{form.type === "outbound" ? "來源" : "供應商"}</label>
              {form.type === "outbound" ? <select value={form.fromStore} onChange={e => set("fromStore", e.target.value)} style={inputStyle}>{stores.map(s => <option key={s.id} value={s.id} style={{ background: "#1a1f2e" }}>{s.name}</option>)}</select> : <input placeholder="供應商名稱" value={form.fromStore} onChange={e => set("fromStore", e.target.value)} style={inputStyle} />}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>目的地</label>
              <select value={form.toStore} onChange={e => set("toStore", e.target.value)} style={inputStyle}>{stores.map(s => <option key={s.id} value={s.id} style={{ background: "#1a1f2e" }}>{s.name}</option>)}</select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>數量 *</label>
              <input type="number" min="1" placeholder="0" value={form.qty} onChange={e => set("qty", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>操作人員 *</label>
              <input placeholder="姓名" value={form.operator} onChange={e => set("operator", e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 14 }}>取消</button>
          <button onClick={handleSubmit} style={{ flex: 2, padding: "10px 0", borderRadius: 8, cursor: "pointer", background: "linear-gradient(135deg, #f97316, #ea580c)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 16px rgba(249,115,22,0.4)" }}>✅ 確認送出</button>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#94a3b8", marginBottom: 6 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color, display: "flex", justifyContent: "space-between", gap: 16 }}><span>{p.name}</span><span style={{ fontWeight: 700 }}>{p.value}</span></div>)}
    </div>
  );
}

function App() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState(RECENT_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [showModal, setShowModal] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const stats = useMemo(() => {
    const lowStock = products.filter(isLowStock);
    const totalValue = products.reduce((acc, p) => acc + p.quantity * p.avgCost, 0);
    return { lowStock: lowStock.length, totalValue, totalProducts: products.length };
  }, [products]);

  const filteredProducts = useMemo(() =>
    products.filter(p => p.name.includes(searchQ) || p.sku.includes(searchQ)),
    [products, searchQ]
  );

  const handleTransactionSubmit = (form) => {
    const product = products.find(p => p.id === +form.productId);
    const qty = +form.qty;
    const delta = form.type === "outbound" ? -qty : qty;
    setProducts(prev => prev.map(p => p.id === +form.productId ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p));
    const newTx = { id: Date.now(), time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }), type: form.type === "outbound" ? "出貨" : "進貨", product: product?.name, qty, from: form.type === "outbound" ? "中央廚房" : form.fromStore, to: STORES.find(s => s.id === +form.toStore)?.name || "未知", operator: form.operator };
    setTransactions(prev => [newTx, ...prev.slice(0, 49)]);
  };

  const tabStyle = (t) => ({ padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, background: activeTab === t ? "rgba(249,115,22,0.2)" : "transparent", border: `1px solid ${activeTab === t ? "#f97316" : "transparent"}`, color: activeTab === t ? "#f97316" : "#64748b", transition: "all 0.15s ease" });

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#f1f5f9", fontFamily: "'IBM Plex Sans', 'Noto Sans TC', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        input, select { font-family: inherit; }
      `}</style>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(13,17,23,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 12px rgba(249,115,22,0.4)" }}>🍜</div>
          <div><div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>阿輝麵線庫存管理</div><div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em" }}>AHUI NOODLE INVENTORY</div></div>
        </div>
        <nav style={{ display: "flex", gap: 4 }}>
          {[["overview", "📊 總覽"], ["inventory", "📦 食材"], ["reports", "📈 報表"]].map(([t, l]) => <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>{l}</button>)}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setIsAdmin(!isAdmin)} style={{ background: isAdmin ? "rgba(16,185,129,0.1)" : "rgba(249,115,22,0.1)", border: `1px solid ${isAdmin ? "#10b981" : "#f97316"}`, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: isAdmin ? "#10b981" : "#f97316", cursor: "pointer", fontWeight: 600 }}>{isAdmin ? "🔒 管理者模式" : "🚚 運輸人員模式"}</button>
          <button onClick={() => setShowModal(true)} style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", border: "none", borderRadius: 8, color: "#fff", padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+ 新增調度</button>
        </div>
      </header>

      <main style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${isAdmin ? 4 : 3}, 1fr)`, gap: 16 }}>
              <StatCard label="管理食材品項" value={stats.totalProducts} icon="🦑" sub="全線食材監控" accent="#3b82f6" />
              {isAdmin && <StatCard label="庫存總估值" value={fmtCurrency(stats.totalValue)} icon="💰" sub="以成本價計算" accent="#10b981" />}
              <StatCard label="缺補通知" value={`${stats.lowStock} 項`} icon="🚨" sub="低於安全水位" accent={stats.lowStock > 0 ? "#ef4444" : "#10b981"} />
              <StatCard label="今日調度" value={transactions.length} icon="🚚" sub="分店配送筆數" accent="#f59e0b" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "#94a3b8" }}>📉 食材配送量趨勢（近7日）</div>
                <ResponsiveContainer width="100%" height={220}><LineChart data={TREND_DATA}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} /><YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} /><Tooltip content={<CustomTooltip />} /><Legend /><Line type="monotone" dataKey="中央廚房" stroke="#f97316" /><Line type="monotone" dataKey="士捷" stroke="#3b82f6" /><Line type="monotone" dataKey="石牌" stroke="#8b5cf6" /><Line type="monotone" dataKey="旗艦" stroke="#10b981" /></LineChart></ResponsiveContainer>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "#94a3b8" }}>🏬 分店食材消耗比例</div>
                <ResponsiveContainer width="100%" height={160}><PieChart><Pie data={BRANCH_USAGE} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={40}>{BRANCH_USAGE.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        {activeTab === "inventory" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["食材品項", "SKU", "現有庫存", "安全水位", "狀態", ...(isAdmin ? ["成本單價", "總金額估值"] : []), "來源"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#475569", fontSize: 11, fontWeight: 600 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 16px", fontSize: 13 }}>{p.name}</td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b" }}>{p.sku}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: isLowStock(p) ? "#ef4444" : "#10b981" }}>{p.quantity} {p.unit}</td>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>{p.threshold} {p.unit}</td>
                      <td style={{ padding: "14px 16px" }}><StockBadge qty={p.quantity} threshold={p.threshold} /></td>
                      {isAdmin && <td style={{ padding: "14px 16px" }}>{fmtCurrency(p.avgCost)}</td>}
                      {isAdmin && <td style={{ padding: "14px 16px", fontWeight: 600 }}>{fmtCurrency(p.quantity * p.avgCost)}</td>}
                      <td style={{ padding: "14px 16px", fontSize: 12 }}>{p.supplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      {showModal && <TransactionModal onClose={() => setShowModal(false)} products={products} stores={STORES} onSubmit={handleTransactionSubmit} />}
    </div>
  );
}
export default App;
