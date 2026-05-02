import MainLayout from "../../components/layouts/MainLayout";
import AgentAssistant from "../../components/agent/AgentAssistant";

export default function HRAssistantPage() {
	const stored = JSON.parse(localStorage.getItem("user") || "{}");
	const userName = stored.name || "HR Officer";
	const userInitials = userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
	return (
		<MainLayout role="hr" pageTitle="Assistant" userName={userName} userInitials={userInitials} notifCount={0} contentPadding={12}>
			<AgentAssistant role="hr_officer" embedded />
		</MainLayout>
	);
}
