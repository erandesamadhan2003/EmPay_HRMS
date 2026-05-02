import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export const useAuth = () => {
    const navigate = useNavigate();

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState(null);
    
    const [companyId, setCompanyId] = useState(null);
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [createCompanyError, setCreateCompanyError] = useState(null);

    const [isRegistering, setIsRegistering] = useState(false);
    const [registerError, setRegisterError] = useState(null);

    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewError, setReviewError] = useState(null);

    const login = useCallback(async (credentials) => {
        setIsLoggingIn(true);
        setLoginError(null);
        try {
            const data = await authService.login(credentials);
            navigate('/dashboard', { replace: true });
            return data;
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed');
            throw err;
        } finally {
            setIsLoggingIn(false);
        }
    }, [navigate]);

    const createCompany = useCallback(async (companyData) => {
        setIsCreatingCompany(true);
        setCreateCompanyError(null);
        try {
            const envelope = await authService.createCompany(companyData);
            const cid = envelope?.data?.id;
            if (cid) setCompanyId(cid);
            return envelope;
        } catch (err) {
            setCreateCompanyError(err.response?.data?.message || 'Failed to create company');
            throw err;
        } finally {
            setIsCreatingCompany(false);
        }
    }, []);

    const registerUser = useCallback(async (userData) => {
        setIsRegistering(true);
        setRegisterError(null);
        
        const payload = { ...userData, company_id: companyId };
        
        try {
            const data = await authService.registerUser(payload);
            navigate('/registration-pending', { replace: true });
            return data;
        } catch (err) {
            setRegisterError(err.response?.data?.message || 'Registration failed');
            throw err;
        } finally {
            setIsRegistering(false);
        }
    }, [navigate, companyId]);

    const reviewRequest = useCallback(async (requestId, reviewData) => {
        setIsReviewing(true);
        setReviewError(null);
        try {
            const data = await authService.reviewCompanyRequest(requestId, reviewData);
            return data;
        } catch (err) {
            setReviewError(err.response?.data?.message || 'Review failed');
            throw err;
        } finally {
            setIsReviewing(false);
        }
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        navigate('/login', { replace: true });
    }, [navigate]);

    return {
        login,
        isLoggingIn,
        loginError,

        createCompany,
        isCreatingCompany,
        createCompanyError,
        companyId,

        registerUser,
        isRegistering,
        registerError,

        reviewRequest,
        isReviewing,
        reviewError,

        logout,
    };
};