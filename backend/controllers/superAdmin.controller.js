import { successResponse, errorResponse } from '../utils/constant.js';
import { findCompanyRequestById, reviewCompanyRequest as reviewCompanyRequestModel } from '../models/CompanyRequest.js';
import { activateUser } from '../models/User.js';

export async function reviewCompanyRequest(req, res) {
    try {
        const { id } = req.params;
        const { action, reviewer_notes } = req.body;

        if (!['approve', 'reject'].includes(action)) return res.status(400).json(errorResponse('Invalid action'));

        const requestRow = await findCompanyRequestById(req.db, id);
        if (!requestRow) return res.status(404).json(errorResponse('Request not found'));

        const status = action === 'approve' ? 'approved' : 'rejected';
        const updatedRequest = await reviewCompanyRequestModel(req.db, {
            requestId: id,
            reviewerId: req.user.id,
            status,
            reviewerNotes: reviewer_notes,
        });

        if (action === 'approve') {
            await activateUser(req.db, requestRow.admin_user_id);
        }

        return res.json(successResponse(updatedRequest, `Company request ${status}`));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Review failed'));
    }
}
