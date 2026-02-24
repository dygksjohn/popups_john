import { useState, useEffect } from "react";
import {
  RefreshCw,
  CreditCard,
  X,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import ds, { cardStyle, statusMap } from "../shared/designTokens";
import { Pill, DataTable, Td } from "../shared/Components";
import DATA from "../shared/data";

function Toast({ msg, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg =
    type === "success" ? "#10B981" : type === "error" ? "#EF4444" : "#F59E0B";
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        background: bg,
        color: "#fff",
        padding: "12px 22px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: ds.ff,
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
        animation: "toastIn .25s ease",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {type === "success" ? "✓" : "✕"} {msg}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn .15s ease",
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 420,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "slideUp .2s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── KPI 카드 ── */
function KpiCard({ icon: I, label, value, sub, color, bg }) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <I size={20} color={color} strokeWidth={2} />
      </div>
      <div>
        <div
          style={{
            fontSize: 11.5,
            color: ds.ink4,
            fontWeight: 600,
            marginBottom: 3,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: ds.ink }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: ds.ink4, marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentManage() {
  const [items, setItems] = useState(() =>
    DATA.participants.map((e) => ({ ...e })),
  );
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => setToast({ msg, type });

  const totalPaid = items
    .filter((p) => p.payStatus === "paid")
    .reduce((a, b) => a + b.amount, 0);
  const totalRefund = items
    .filter((p) => p.payStatus === "refunded")
    .reduce((a, b) => a + b.amount, 0);
  const unpaidCount = items.filter((p) => p.payStatus === "unpaid").length;

  const handleRefund = () => {
    setItems((p) =>
      p.map((e) => (e.id === confirmId ? { ...e, payStatus: "refunded" } : e)),
    );
    setConfirmId(null);
    show("환불 처리되었습니다.");
  };

  const cols = [
    { label: "" },
    { label: "ID" },
    { label: "참가자" },
    { label: "행사" },
    { label: "금액", align: "right" },
    { label: "결제수단" },
    { label: "결제상태" },
    { label: "" },
  ];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <KpiCard
          icon={DollarSign}
          label="총 결제 금액"
          value={`${totalPaid.toLocaleString()}원`}
          color={ds.brand}
          bg={ds.brandSoft}
        />
        <KpiCard
          icon={RefreshCw}
          label="환불 금액"
          value={`${totalRefund.toLocaleString()}원`}
          sub={`${items.filter((p) => p.payStatus === "refunded").length}건`}
          color={ds.red}
          bg={ds.redSoft}
        />
        <KpiCard
          icon={AlertCircle}
          label="미결제"
          value={`${unpaidCount}건`}
          color={ds.amber}
          bg={ds.amberSoft}
        />
      </div>
      <DataTable
        title="결제 내역"
        count={items.length}
        columns={cols}
        rows={items}
        renderRow={(r) => {
          const ps = statusMap[r.payStatus] || statusMap.paid;
          return (
            <tr
              key={r.id}
              style={{
                borderBottom: `1px solid ${ds.lineSoft}`,
                transition: "background .1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ds.bg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Td>
                <input type="checkbox" style={{ accentColor: ds.brand }} />
              </Td>
              <Td mono>{r.id}</Td>
              <Td bold>{r.name}</Td>
              <Td>{r.event}</Td>
              <Td align="right" bold>
                {r.amount.toLocaleString()}원
              </Td>
              <Td>{r.payMethod}</Td>
              <Td>
                <Pill color={ps.c} bg={ps.bg}>
                  {ps.l}
                </Pill>
              </Td>
              <Td>
                {r.payStatus === "paid" && (
                  <button
                    onClick={() => setConfirmId(r.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 10px",
                      borderRadius: 6,
                      border: `1px solid ${ds.red}22`,
                      background: ds.redSoft,
                      color: ds.red,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: ds.ff,
                    }}
                  >
                    <RefreshCw size={12} /> 환불
                  </button>
                )}
                {r.payStatus === "unpaid" && (
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 10px",
                      borderRadius: 6,
                      border: `1px solid ${ds.brand}22`,
                      background: ds.brandSoft,
                      color: ds.brand,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: ds.ff,
                    }}
                  >
                    <CreditCard size={12} /> 결제요청
                  </button>
                )}
              </Td>
            </tr>
          );
        }}
      />
      {confirmId && (
        <Overlay onClose={() => setConfirmId(null)}>
          <div style={{ padding: 28 }}>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: ds.ink,
                margin: "0 0 10px",
              }}
            >
              환불 처리
            </h3>
            <p style={{ fontSize: 13.5, color: ds.ink3, lineHeight: 1.6 }}>
              해당 결제를 환불 처리하시겠습니까?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 22,
              }}
            >
              <button
                onClick={() => setConfirmId(null)}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: `1px solid ${ds.line}`,
                  background: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: ds.ff,
                  color: ds.ink2,
                }}
              >
                취소
              </button>
              <button
                onClick={handleRefund}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: ds.red,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: ds.ff,
                }}
              >
                환불 처리
              </button>
            </div>
          </div>
        </Overlay>
      )}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
