import MainLayout from "../../components/layouts/MainLayout";
import AgentAssistant from "../../components/agent/AgentAssistant";

export default function EmployeeAssistantPage() {
	const stored = JSON.parse(localStorage.getItem("user") || "{}");
	const userName = stored.name || "Employee";
	const userInitials = userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
	return (
		<MainLayout role="employee" pageTitle="Assistant" userName={userName} userInitials={userInitials} notifCount={0} contentPadding={12}>
			<AgentAssistant role="employee" embedded />
		</MainLayout>
	);
}
