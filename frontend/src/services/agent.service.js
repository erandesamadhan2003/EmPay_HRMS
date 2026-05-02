import api from "../api/api";
import { API_PATHS } from "../api/endpoints";

export const agentService = {
	chat: async ({ message, confirmation } = {}) => {
		const body = {};
		if (message) body.message = message;
		if (confirmation) body.confirmation = confirmation;
		const response = await api.post(API_PATHS.agent.chat, body);
		return response.data;
	},
};

export default agentService;
