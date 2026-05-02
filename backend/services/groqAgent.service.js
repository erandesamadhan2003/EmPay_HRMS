import Groq from "groq-sdk";

const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

function buildSystemPrompt() {
	return [
		"You are an intent planner for EmPay HRMS.",
		"Return strict JSON only. No markdown.",
		"Pick exactly one action from:",
		"- get_my_attendance_current_month",
		"- get_my_payslips",
		"- get_employee_attendance",
		"- list_employees_by_department",
		"- deactivate_employee",
		"- ask_clarification",
		"",
		"Context on backend routes:",
		"- GET /api/attendance/me?month=YYYY-MM",
		"- GET /api/payslips/me?page=1&limit=10",
		"- GET /api/attendance/:userId?month=YYYY-MM",
		"- GET /api/employees?department=<uuid>&search=&page=1&limit=10&status=active",
		"- DELETE /api/employees/:id (dangerous; admin only)",
		"",
		"Rules:",
		"- If request implies delete/deactivate/remove employee, choose deactivate_employee and dangerous=true.",
		"- If employee asks for own data, choose my actions.",
		"- If request has missing required parameters (like employee id or department), choose ask_clarification.",
		"- Only include arguments needed by selected action.",
		"",
		"Return JSON schema:",
		`{
  "action": "one_of_actions",
  "dangerous": boolean,
  "confidence": number,
  "arguments": {
    "userId": "uuid optional",
    "department": "name or uuid optional",
    "month": "YYYY-MM optional",
    "page": 1,
    "limit": 10
  },
  "clarification": "string when action=ask_clarification, otherwise empty"
}`,
	].join("\n");
}

function safeJsonParse(text) {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

export async function planAgentAction({ message, user }) {
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) {
		throw new Error("GROQ_API_KEY is not configured");
	}

	const client = new Groq({ apiKey });
	let completion;
	try {
		completion = await client.chat.completions.create({
			model: DEFAULT_MODEL,
			temperature: 0.1,
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: buildSystemPrompt() },
				{
					role: "user",
					content: JSON.stringify({
						message,
						userRole: user?.role || null,
					}),
				},
			],
		});
	} catch (err) {
		const status = err?.status ?? err?.response?.status;
		const detail = err?.message || "Unknown Groq SDK error";
		throw new Error(`Groq API failed${status ? ` (${status})` : ""}: ${detail}`);
	}

	const text = completion?.choices?.[0]?.message?.content || "{}";
	const parsed = safeJsonParse(text);
	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid planner response from Groq");
	}
	return parsed;
}
