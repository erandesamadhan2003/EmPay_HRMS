import { useMemo, useState } from "react";
import { agentService } from "../../services/agent.service";

const ALLOWED_ROLES = new Set(["admin", "hr", "hr_officer", "employee"]);

function formatDate(value) {
	if (!value) return "-";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return String(value);
	return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(value) {
	if (!value) return "-";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "-";
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMoney(value) {
	if (value == null || Number.isNaN(Number(value))) return "-";
	return Number(Math.max(0, value)).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}w

function summarizeActionPayload(action, data) {
	if (!data || typeof data !== "object") return "No data returned.";
	if (action === "get_my_attendance_current_month" || action === "get_employee_attendance") {
		const count = Array.isArray(data.items) ? data.items.length : 0;
		const month = data.month || "selected month";
		return `Attendance for ${month} (${count} record${count === 1 ? "" : "s"}).`;
	}
	if (action === "get_my_payslips") {
		const count = Array.isArray(data.items) ? data.items.length : 0;
		return `Found ${count} payslip entr${count === 1 ? "y" : "ies"}.`;
	}
	if (action === "list_employees_by_department") {
		const count = Array.isArray(data.items) ? data.items.length : 0;
		return `Found ${count} employees in the requested department.`;
	}
	if (action === "deactivate_employee") {
		return `Employee ${data.userId || ""} was deactivated successfully.`;
	}
	return "Action completed.";
}

function ResultCard({ item }) {
	const data = item.meta || {};
	if (!data || typeof data !== "object") return null;

	const shell = (title, subtitle, content) => (
		<div style={{ marginTop: 8, border: "1px solid #2E2E3E", borderRadius: 10, overflow: "hidden", background: "#11121A" }}>
			<div style={{ padding: "8px 10px", fontSize: 12, color: "#A8A8BA", background: "#161727", borderBottom: "1px solid #2A2A3A" }}>
				<strong style={{ color: "#ECECF8", fontWeight: 600 }}>{title}</strong>
				{subtitle ? <span style={{ marginLeft: 8 }}>{subtitle}</span> : null}
			</div>
			<div style={{ padding: 0 }}>{content}</div>
		</div>
	);

	if (item.action === "get_my_attendance_current_month" || item.action === "get_employee_attendance") {
		const rows = Array.isArray(data.items) ? data.items : [];
		return shell(
			"Attendance",
			`Month: ${data.month || "-"} | Total: ${data?.pagination?.total ?? rows.length}`,
			rows.length === 0 ? (
				<div style={{ padding: 12, fontSize: 12, color: "#A8A8BA" }}>No attendance records found.</div>
			) : (
				<div style={{ overflowX: "auto" }}>
					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
						<thead>
							<tr style={{ background: "#13142A", color: "#A8A8BA" }}>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Date</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Check In</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Check Out</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Hours</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Status</th>
							</tr>
						</thead>
						<tbody>
							{rows.slice(0, 12).map((r) => (
								<tr key={r.id} style={{ borderTop: "1px solid #222232" }}>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{formatDate(r.date)}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{formatTime(r.checkIn)}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{formatTime(r.checkOut)}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{r.workHours ?? "-"}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF", textTransform: "capitalize" }}>{r.status || "-"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			),
		);
	}

	if (item.action === "get_my_payslips") {
		const rows = Array.isArray(data.items) ? data.items : [];
		return shell(
			"My Payslips",
			`Total: ${data?.pagination?.total ?? rows.length}`,
			rows.length === 0 ? (
				<div style={{ padding: 12, fontSize: 12, color: "#A8A8BA" }}>No payslips found.</div>
			) : (
				<div style={{ overflowX: "auto" }}>
					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
						<thead>
							<tr style={{ background: "#13142A", color: "#A8A8BA" }}>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Pay Date</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Period</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Gross</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Net</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Status</th>
							</tr>
						</thead>
						<tbody>
							{rows.slice(0, 12).map((r) => (
								<tr key={r.id} style={{ borderTop: "1px solid #222232" }}>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{formatDate(r.payDate)}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>
										{formatDate(r.periodStart)} - {formatDate(r.periodEnd)}
									</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{formatMoney(r.grossSalary)}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF", fontWeight: 600 }}>{formatMoney(r.netSalary)}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF", textTransform: "capitalize" }}>{r.status || "-"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			),
		);
	}

	if (item.action === "list_employees_by_department") {
		const rows = Array.isArray(data.items) ? data.items : [];
		return shell(
			"Employees",
			`Total: ${data?.pagination?.total ?? rows.length}`,
			rows.length === 0 ? (
				<div style={{ padding: 12, fontSize: 12, color: "#A8A8BA" }}>No employees found.</div>
			) : (
				<div style={{ overflowX: "auto" }}>
					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
						<thead>
							<tr style={{ background: "#13142A", color: "#A8A8BA" }}>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Name</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Login ID</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Department</th>
								<th style={{ textAlign: "left", padding: "8px 10px" }}>Role</th>
							</tr>
						</thead>
						<tbody>
							{rows.slice(0, 15).map((r) => (
								<tr key={r.id} style={{ borderTop: "1px solid #222232" }}>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{r.name || "-"}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{r.loginId || "-"}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{r.department || "-"}</td>
									<td style={{ padding: "8px 10px", color: "#F1F0FF" }}>{r.role || "-"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			),
		);
	}
	return null;
}

function MessageBubble({ item }) {
	const isUser = item.sender === "user";
	const bg = isUser ? "#14B8A6" : "#171826";
	const color = "#F1F0FF";
	return (
		<div
			style={{
				alignSelf: isUser ? "flex-end" : "flex-start",
				background: bg,
				color,
				borderRadius: 14,
				padding: "10px 12px",
				maxWidth: isUser ? "70%" : "97%",
				fontSize: 13,
				lineHeight: 1.45,
				whiteSpace: "pre-wrap",
				border: isUser ? "none" : "1px solid #26273A",
			}}
		>
			<div>{item.text}</div>
			<ResultCard item={item} />
		</div>
	);
}

export default function AgentAssistant({ role, embedded = true }) {
	const normalizedRole = String(role || "").toLowerCase();
	const canUseAgent = ALLOWED_ROLES.has(normalizedRole);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState([
		{
			id: "m0",
			sender: "assistant",
			text: "Ask me anything about attendance, payslips, or employees.\nExamples:\n- Show my attendance for current month\n- Show my payslips\n- Show attendance for employee id <uuid>\n- List all employees of finance dept",
		},
	]);
	const [pendingConfirmation, setPendingConfirmation] = useState(null);


	if (!canUseAgent) return null;

	const append = (sender, text, meta = null) => {
		setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, sender, text, meta }]);
	};

	const sendMessage = async () => {
		const msg = input.trim();
		if (!msg || loading) return;
		setInput("");
		append("user", msg);
		setLoading(true);
		try {
			const response = await agentService.chat({ message: msg });
			const data = response?.data || {};
			if (data.kind === "clarification") {
				append("assistant", data.question || "Please provide more details.");
			} else if (data.kind === "confirmation_required") {
				setPendingConfirmation({
					token: data.confirmationToken,
					action: data.action,
				});
				append(
					"assistant",
					`${data.warning || "This action needs confirmation."}\nClick Confirm to proceed.`,
				);
			} else if (data.kind === "action_result") {
				append("assistant", summarizeActionPayload(data.action, data.data), data.data);
			} else {
				append("assistant", response?.message || "Completed.");
			}
		} catch (err) {
			const msg = err?.response?.data?.message || "Agent request failed. Please try again.";
			const nicer = msg === "Forbidden"
				? "You do not have permission for that request. Try a role-allowed action."
				: msg;
			append(
				"assistant",
				nicer,
			);
		} finally {
			setLoading(false);
		}
	};

	const confirmAction = async (approved) => {
		if (!pendingConfirmation || loading) return;
		if (!approved) {
			append("assistant", "Action cancelled.");
			setPendingConfirmation(null);
			return;
		}
		setLoading(true);
		try {
			const response = await agentService.chat({
				confirmation: {
					approved: true,
					token: pendingConfirmation.token,
				},
			});
			const data = response?.data || {};
			if (data.kind === "action_result") {
				append("assistant", summarizeActionPayload(data.action, data.data), data.data);
			} else {
				append("assistant", response?.message || "Action completed.");
			}
		} catch (err) {
			append("assistant", err?.response?.data?.message || "Confirmation failed.");
		} finally {
			setPendingConfirmation(null);
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				width: "100%",
				maxWidth: "100%",
				margin: 0,
				height: embedded ? "calc(100vh - 150px)" : 560,
				minHeight: 520,
				background: "#13131A",
				border: "1px solid #2E2E3E",
				borderRadius: 14,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>

			<div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
				{messages.map((m) => (
					<MessageBubble key={m.id} item={m} />
				))}
			</div>
			{pendingConfirmation && (
				<div style={{ display: "flex", gap: 8, padding: "0 12px 10px" }}>
					<button
						onClick={() => confirmAction(true)}
						disabled={loading}
						style={{ flex: 1, border: "none", borderRadius: 8, padding: "8px 10px", background: "#EF4444", color: "#fff", cursor: "pointer" }}
					>
						Confirm Action
					</button>
					<button
						onClick={() => confirmAction(false)}
						disabled={loading}
						style={{ flex: 1, border: "1px solid #2E2E3E", borderRadius: 8, padding: "8px 10px", background: "transparent", color: "#F1F0FF", cursor: "pointer" }}
					>
						Cancel
					</button>
				</div>
			)}
			<div style={{ display: "flex", gap: 8, borderTop: "1px solid #2E2E3E", padding: 12 }}>
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") sendMessage();
					}}
					disabled={loading}
					placeholder="Type a request..."
					style={{
						flex: 1,
						background: "#0A0A0F",
						border: "1px solid #2E2E3E",
						borderRadius: 8,
						padding: "10px 11px",
						color: "#F1F0FF",
						fontSize: 12,
					}}
				/>
				<button
					onClick={sendMessage}
					disabled={loading || !input.trim()}
					style={{
						border: "none",
						borderRadius: 8,
						padding: "10px 12px",
						background: "#14B8A6",
						color: "#fff",
						fontWeight: 600,
						cursor: "pointer",
					}}
				>
					{loading ? "..." : "Send"}
				</button>
			</div>
		</div>
	);
}
