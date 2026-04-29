import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─────────────────────────────────────────
// MOCK DATA (替換為後端 API 回傳資料)
// ─────────────────────────────────────────
const STORES = [
  { id: 1, name: "大西倉庫", type: "warehouse", color: "#f97316" },
  { id: 2, name: "士捷分店", type: "branch", color: "#3b82f6" },
  { id: 3, name: "石牌分店", type: "branch", color: "#8b5cf6" },
  { id: 4, name: "旗艦分店", type: "branch", color: "#10b981" },
];

const INITIAL_PRODUCTS = [
  { id: 1, name: "醫療口罩 (50入)", sku: "MASK-50", unit: "盒", quantity: 85, threshold: 100, avgCost: 120, supplier: "台灣防護股份有限公司", supplierContact: "02-2345-6789" },
  { id: 2, name: "酒精濕紙巾 (100片)", sku: "WP-100", unit: "包", quantity: 210, threshold: 80, avgCost: 65, supplier: "清潔大師有限公司", supplierContact: "04-1234-5678" },
  { id: 3, name: "血壓計", sku: "BP-001", unit: "台", quantity: 12, threshold: 20, avgCost: 1580, supplier: "歐姆龍醫療", supplierContact: "03-9876-5432" },
  { id: 4, name: "血糖試紙 (50片)", sku: "GS-050", unit: "盒", quantity: 45, threshold: 30, avgCost: 380, supplier: "羅氏診斷", supplierContact: "02-8765-4321" },
  { id: 5, name: "彈性繃帶 (5cm)", sku: "EB-5CM", unit: "卷", quantity: 6, threshold: 50, avgCost: 28, supplier: "台灣防護股份有限公司", supplierContact: "02-2345-6789" },
  { id: 6, name: "體溫計 (電子)", sku: "TH-EL", unit: "支", quantity: 33, threshold: 25, avgCost: 245, supplier: "精準醫療器材", supplierContact: "06-5432-1098" },
];

const TREND_DATA = [
  { date: "04/23", 大西倉庫: 320, 士捷: 45, 石牌: 38, 旗艦: 52 },
  { date: "04/24", 大西倉庫: 285, 士捷: 50, 石牌: 42, 旗艦: 48 },
  { date: "04/25", 大西倉庫: 310, 士捷: 38, 石牌: 55, 旗艦: 60 },
  { date: "04/26", 大西倉庫: 260, 士捷: 62, 石牌: 48, 旗艦: 45 },
  { date: "04/27", 大西倉庫: 230, 士捷: 55, 石牌: 40, 旗艦: 52 },
  { date: "04/28", 大西倉庫: 195, 士捷: 48, 石牌: 35, 旗艦: 58 },
  { date: "04/29", 大西倉庫: 170, 士捷: 42, 石牌: 50, 旗艦: 44 },
];

const BRANCH_USAGE = [
  { name: "士捷分店", value: 340, fill: "#3b82f6" },
  { name: "石牌分店", value: 308, fill: "#8b5cf6" },
  { name: "旗艦分店", value: 359, fill: "#10b981" },
];

const RECENT_TRANSACTIONS = [
  { id: 1, time: "14:32", type: "出貨", product: "醫療口罩 (50入)", qty: 15, from: "大西倉庫", to: "士捷分店", operator: "張小明" },
  { id: 2, time: "13:15", type: "進貨", product: "血壓計", qty: 5, from: "歐姆龍醫療", to: "大西倉庫", operator: "系統" },
  { id: 3, time: "11:48", type: "出貨", product: "酒精濕紙巾 (100片)", qty: 30, from: "大西倉庫", to: "旗艦分店", operator: "李大華" },
  { id: 4, time: "10:20", type: "出貨", product: "彈性繃帶 (5cm)", qty: 20, from: "大西倉庫", to: "石牌分店", operator: "王志遠" },
  { id: 5, time: "09:05", type: "進貨", product: "血糖試紙 (50片)", qty: 50, from: "羅氏診斷", to: "大西倉庫", operator: "系統" },
];

// ─────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────
const isLowStock = (p) => p.quantity < p.threshold;
const fmtCurrency = (n) => `NT$ ${n.toLocaleString()}`;

// ─────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────

/** 頂部統計卡片 */
function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: "20px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ color: "#94a3b8", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ color: accent || "#f1f5f9", fontSize: 28, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      {sub && <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{sub}</div>}
      <div style={{
        position: "absolute", right: -16, bottom: -16,
        width: 80, height: 80, borderRadius: "50%",
        background: `${accent || "#3b82f6"}18`
      }} />
    </div>
  );
}

/** 庫存警示 Badge */
function StockBadge({ qty, threshold }) {
  const pct = qty / threshold;
  const color = pct < 0.5 ? "#ef4444" : pct < 1 ? "#f59e0b" : "#10b981";
  const label = pct < 0.5 ? "嚴重不足" : pct < 1 ? "低於水位" : "正常";
  return (
    <span style={{
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
      borderRadius: 99,
      padding: "2px 10px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.04em"
    }}>{label}</span>
  );
}

/** 進出貨表單 Modal */
function TransactionModal({ onClose, products, stores, onSubmit }) {
  const [form, setForm] = useState({
    type: "outbound", // outbound | inbound
    productId: products[0]?.id || "",
    qty: "",
    fromStore: "1",
    toStore: "2",
    operator: "",
    note: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.qty || !form.operator) {
      alert("請填寫數量與操作人員");
      return;
    }
    onSubmit(form);
    onClose();
  };

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
    color: "#f1f5f9", padding: "8px 12px", fontSize: 14, outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20, padding: 32, width: 480, maxWidth: "90vw",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, margin: 0 }}>📋 新增異動單</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* 類型切換 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["outbound", "🚚 領貨出倉"], ["inbound", "📦 進貨入倉"]].map(([v, l]) => (
            <button key={v} onClick={() => set("type", v)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: form.type === v ? "#f97316" : "rgba(255,255,255,0.06)",
              border: `1px solid ${form.type === v ? "#f97316" : "rgba(255,255,255,0.1)"}`,
              color: form.type === v ? "#fff" : "#94a3b8",
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>品項 *</label>
            <select value={form.productId} onChange={e => set("productId", e.target.value)} style={inputStyle}>
              {products.map(p => (
                <option key={p.id} value={p.id} style={{ background: "#1a1f2e" }}>{p.name} (現有: {p.quantity}{p.unit})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>
                {form.type === "outbound" ? "來源 (倉庫)" : "供應商"}
              </label>
              {form.type === "outbound"
                ? <select value={form.fromStore} onChange={e => set("fromStore", e.target.value)} style={inputStyle}>
                    {stores.map(s => <option key={s.id} value={s.id} style={{ background: "#1a1f2e" }}>{s.name}</option>)}
                  </select>
                : <input placeholder="供應商名稱" value={form.fromStore} onChange={e => set("fromStore", e.target.value)} style={inputStyle} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>目的地</label>
              <select value={form.toStore} onChange={e => set("toStore", e.target.value)} style={inputStyle}>
                {stores.map(s => <option key={s.id} value={s.id} style={{ background: "#1a1f2e" }}>{s.name}</option>)}
              </select>
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

          <div>
            <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6 }}>備註</label>
            <input placeholder="選填" value={form.note} onChange={e => set("note", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#94a3b8", fontSize: 14
          }}>取消</button>
          <button onClick={handleSubmit} style={{
            flex: 2, padding: "10px 0", borderRadius: 8, cursor: "pointer",
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
            boxShadow: "0 4px 16px rgba(249,115,22,0.4)"
          }}>✅ 確認送出</button>
        </div>
      </div>
    </div>
  );
}

/** 自訂 Recharts Tooltip */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12
    }}>
      <div style={{ color: "#94a3b8", marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span>{p.name}</span><span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────
function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState(RECENT_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState("overview"); // overview | inventory | reports | stores
  const [showModal, setShowModal] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // 統計數據
  const stats = useMemo(() => {
    const lowStock = products.filter(isLowStock);
    const totalValue = products.reduce((acc, p) => acc + p.quantity * p.avgCost, 0);
    return { lowStock: lowStock.length, totalValue, totalProducts: products.length };
  }, [products]);

  const filteredProducts = useMemo(() =>
    products.filter(p => p.name.includes(searchQ) || p.sku.includes(searchQ)),
    [products, searchQ]
  );

  // 提交異動單
  const handleTransactionSubmit = (form) => {
    const product = products.find(p => p.id === +form.productId);
    const qty = +form.qty;
    const delta = form.type === "outbound" ? -qty : qty;

    // 更新庫存
    setProducts(prev => prev.map(p =>
      p.id === +form.productId ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p
    ));

    // 新增異動記錄
    const newTx = {
      id: Date.now(),
      time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }),
      type: form.type === "outbound" ? "出貨" : "進貨",
      product: product?.name,
      qty,
      from: form.type === "outbound" ? "大西倉庫" : form.fromStore,
      to: STORES.find(s => s.id === +form.toStore)?.name || "未知",
      operator: form.operator,
    };
    setTransactions(prev => [newTx, ...prev.slice(0, 49)]);

    // 警示提醒（前端模擬，後端應觸發 Discord Webhook）
    const updated = products.find(p => p.id === +form.productId);
    if (updated && (updated.quantity + delta) < updated.threshold) {
      console.warn(`[LOW STOCK ALERT] ${updated.name} → ${updated.quantity + delta} ${updated.unit} (水位: ${updated.threshold})`);
      // 實際：呼叫 POST /api/notifications/low-stock
    }
  };

  // ── 樣式常數
  const tabStyle = (t) => ({
    padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: activeTab === t ? "rgba(249,115,22,0.2)" : "transparent",
    border: `1px solid ${activeTab === t ? "#f97316" : "transparent"}`,
    color: activeTab === t ? "#f97316" : "#64748b",
    transition: "all 0.15s ease",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1117",
      color: "#f1f5f9",
      fontFamily: "'IBM Plex Sans', 'Noto Sans TC', system-ui, sans-serif",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        input, select { font-family: inherit; }
        select option { background: #1a1f2e; color: #f1f5f9; }
        @keyframes pulse-ring { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* ── HEADER */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(13,17,23,0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 4px 12px rgba(249,115,22,0.4)"
          }}>🏪</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>大西庫存管理系統</div>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em" }}>DAXI INVENTORY MANAGEMENT</div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 4 }}>
          {[["overview", "📊 總覽"], ["inventory", "📦 庫存"], ["reports", "📈 報表"], ["stores", "🏬 分店"]].map(([t, l]) => (
            <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>{l}</button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {stats.lowStock > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 99, padding: "4px 12px", fontSize: 12, color: "#ef4444", fontWeight: 600,
              animation: "pulse-ring 2s infinite"
            }}>⚠ {stats.lowStock} 項低庫存</div>
          )}
          <button onClick={() => setShowModal(true)} style={{
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            border: "none", borderRadius: 8, color: "#fff",
            padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700,
            boxShadow: "0 4px 12px rgba(249,115,22,0.35)"
          }}>+ 新增異動</button>
        </div>
      </header>

      {/* ── MAIN CONTENT */}
      <main style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ════ TAB: 總覽 ════ */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <StatCard label="總庫存品項" value={stats.totalProducts} icon="📦" sub="across all locations" accent="#3b82f6" />
              <StatCard label="庫存總值" value={fmtCurrency(stats.totalValue)} icon="💰" sub="平均成本計算" accent="#10b981" />
              <StatCard label="低庫存警示" value={`${stats.lowStock} 項`} icon="⚠️" sub="需要叫貨" accent={stats.lowStock > 0 ? "#ef4444" : "#10b981"} />
              <StatCard label="今日異動" value={transactions.length} icon="🔄" sub="筆記錄" accent="#f59e0b" />
            </div>

            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              {/* 趨勢圖 */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: 24
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "#94a3b8" }}>📉 庫存流向趨勢（近7日）</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={TREND_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Line type="monotone" dataKey="大西倉庫" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="士捷" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="石牌" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="旗艦" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 分店用量 Pie */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: 24
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "#94a3b8" }}>🏬 分店用量分布</div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={BRANCH_USAGE} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                      {BRANCH_USAGE.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {BRANCH_USAGE.map(b => (
                    <div key={b.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.fill, display: "inline-block" }} />
                        <span style={{ color: "#94a3b8" }}>{b.name}</span>
                      </span>
                      <span style={{ color: "#f1f5f9", fontFamily: "'DM Mono', monospace" }}>{b.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 最近異動 */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 24
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#94a3b8" }}>🔄 最近異動記錄</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 16px"
                  }}>
                    <span style={{ color: "#64748b", fontSize: 12, fontFamily: "'DM Mono', monospace", minWidth: 36 }}>{tx.time}</span>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: tx.type === "進貨" ? "rgba(16,185,129,0.15)" : "rgba(249,115,22,0.15)",
                      color: tx.type === "進貨" ? "#10b981" : "#f97316"
                    }}>{tx.type}</span>
                    <span style={{ flex: 1, fontSize: 13, color: "#e2e8f0" }}>{tx.product}</span>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{tx.from} → {tx.to}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#f1f5f9", minWidth: 40, textAlign: "right" }}>×{tx.qty}</span>
                    <span style={{ color: "#475569", fontSize: 12, minWidth: 50 }}>{tx.operator}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB: 庫存 ════ */}
        {activeTab === "inventory" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 搜尋列 */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                placeholder="🔍  搜尋品名或 SKU..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  color: "#f1f5f9", padding: "10px 16px", fontSize: 14, outline: "none"
                }}
              />
              <button onClick={() => setShowModal(true)} style={{
                background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)",
                borderRadius: 10, color: "#f97316", padding: "10px 16px",
                cursor: "pointer", fontSize: 13, fontWeight: 600
              }}>+ 新增品項</button>
            </div>

            {/* 庫存表格 */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, overflow: "hidden"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["品項名稱", "SKU", "現有庫存", "安全水位", "狀態", "平均成本", "庫存金額", "供應商"].map(h => (
                      <th key={h} style={{
                        padding: "12px 16px", textAlign: "left",
                        color: "#475569", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: isLowStock(p) ? "rgba(239,68,68,0.04)" : "transparent",
                      transition: "background 0.15s"
                    }}>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>
                        {isLowStock(p) && <span style={{ marginRight: 6 }}>🔴</span>}{p.name}
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#64748b" }}>{p.sku}</td>
                      <td style={{ padding: "14px 16px", fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: isLowStock(p) ? "#ef4444" : "#10b981" }}>
                        {p.quantity} <span style={{ fontSize: 11, color: "#64748b" }}>{p.unit}</span>
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#64748b" }}>{p.threshold} {p.unit}</td>
                      <td style={{ padding: "14px 16px" }}><StockBadge qty={p.quantity} threshold={p.threshold} /></td>
                      <td style={{ padding: "14px 16px", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#94a3b8" }}>{fmtCurrency(p.avgCost)}</td>
                      <td style={{ padding: "14px 16px", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>
                        {fmtCurrency(p.quantity * p.avgCost)}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b" }}>
                        <div>{p.supplier}</div>
                        <div style={{ color: "#3b82f6", marginTop: 2 }}>{p.supplierContact}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════ TAB: 報表 ════ */}
        {activeTab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 分店每日出貨量 Bar */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 24
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "#94a3b8" }}>📊 各分店每日出貨量（本週）</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  <Bar dataKey="士捷" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="石牌" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="旗艦" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 低庫存警示清單 */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 24
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#ef4444" }}>🚨 需要叫貨清單</div>
              {products.filter(isLowStock).length === 0
                ? <div style={{ color: "#10b981", fontSize: 13 }}>✅ 目前所有品項庫存正常</div>
                : products.filter(isLowStock).map(p => (
                  <div key={p.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10, padding: "12px 16px", marginBottom: 8
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        供應商：{p.supplier}｜{p.supplierContact}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: "#ef4444" }}>
                        {p.quantity} / {p.threshold} {p.unit}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>現有 / 安全水位</div>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Discord 每日摘要預覽 */}
            <div style={{
              background: "rgba(88,101,242,0.08)", border: "1px solid rgba(88,101,242,0.25)",
              borderRadius: 16, padding: 24
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#818cf8" }}>
                🤖 Discord 每日摘要預覽（格式模擬）
              </div>
              <pre style={{
                background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 16,
                fontSize: 11, color: "#94a3b8", lineHeight: 1.8, overflowX: "auto",
                fontFamily: "'DM Mono', monospace",
                whiteSpace: "pre-wrap"
              }}>{`📦 **大西庫存 Daily Digest** | 2025-04-29

| 分店   | 品項              | 出貨量 | 庫存剩餘 |
|--------|-------------------|--------|----------|
| 士捷   | 醫療口罩 (50入)   | 15盒   | 85盒     |
| 旗艦   | 酒精濕紙巾(100片) | 30包   | 210包    |
| 石牌   | 彈性繃帶 (5cm)    | 20卷   | 6卷 ⚠️  |

⚠️ **低庫存警示 (3項)**
- 醫療口罩 (50入): 剩 85盒 / 水位 100盒 | 台灣防護 02-2345-6789
- 血壓計: 剩 12台 / 水位 20台 | 歐姆龍醫療 03-9876-5432
- 彈性繃帶 (5cm): 剩 6卷 / 水位 50卷 | 台灣防護 02-2345-6789`}</pre>
              <button style={{
                marginTop: 12, background: "rgba(88,101,242,0.2)", border: "1px solid rgba(88,101,242,0.4)",
                borderRadius: 8, color: "#818cf8", padding: "8px 16px",
                cursor: "pointer", fontSize: 12, fontWeight: 600
              }}>📤 立即發送至 Discord (模擬)</button>
            </div>
          </div>
        )}

        {/* ════ TAB: 分店 ════ */}
        {activeTab === "stores" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
              管理所有倉庫與分店節點（可新增/停用）
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {STORES.map(s => (
                <div key={s.id} style={{
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}33`,
                  borderRadius: 16, padding: 24, position: "relative", overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute", top: -20, right: -20, width: 100, height: 100,
                    borderRadius: "50%", background: `${s.color}15`
                  }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%", background: s.color,
                      boxShadow: `0 0 8px ${s.color}`
                    }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{s.name}</span>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 4,
                      background: `${s.color}22`, color: s.color, fontWeight: 600
                    }}>{s.type === "warehouse" ? "中心倉庫" : "分店"}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[["本週進貨", "320 件"], ["本週出貨", "148 件"], ["庫存品項", `${products.length} 項`], ["低庫存", `${stats.lowStock} 項`]].map(([l, v]) => (
                      <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{l}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#f1f5f9" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button style={{
              alignSelf: "flex-start", background: "rgba(255,255,255,0.05)",
              border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 12,
              color: "#64748b", padding: "12px 20px", cursor: "pointer", fontSize: 13
            }}>＋ 新增分店節點</button>
          </div>
        )}
      </main>

      {/* ── MODAL */}
      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          products={products}
          stores={STORES}
          onSubmit={handleTransactionSubmit}
        />
      )}
    </div>
  );
}

export default App;
