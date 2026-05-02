import redisClient from '../config/redis.js';

const DEFAULT_EXPIRY = 300;
const DASHBOARD_EXPIRY = 120;
const EMPLOYEE_EXPIRY = 600;
const COMPANY_EXPIRY = 3600;
const USER_EXPIRY = 1800;
const PAYSLIP_EXPIRY = 900;
const ATTENDANCE_EXPIRY = 600;

export async function setCache(key, value, expiry = DEFAULT_EXPIRY) {
    try {
        if (!redisClient.isOpen) return null;
        const serialized = JSON.stringify(value);
        await redisClient.set(key, serialized, { EX: expiry });
        console.log(`[CACHE SET] ${key} (${expiry}s TTL)`);
        return value;
    } catch (err) {
        console.warn(`[CACHE ERROR] SET "${key}":`, err.message);
        return null;
    }
}

export async function getCache(key) {
    try {
        if (!redisClient.isOpen) return null;
        const cached = await redisClient.get(key);
        if (!cached) {
            console.log(`[CACHE MISS] ${key}`);
            return null;
        }
        console.log(`[CACHE HIT] ${key}`);
        return JSON.parse(cached);
    } catch (err) {
        console.warn(`[CACHE ERROR] GET "${key}":`, err.message);
        return null;
    }
}

export async function deleteCache(key) {
    try {
        if (!redisClient.isOpen) return false;
        await redisClient.del(key);
        console.log(`[CACHE DEL] ${key}`);
        return true;
    } catch (err) {
        console.warn(`[CACHE ERROR] DEL "${key}":`, err.message);
        return false;
    }
}

export async function deleteCachePattern(pattern) {
    try {
        if (!redisClient.isOpen) return 0;
        const keys = await redisClient.keys(pattern);
        if (keys.length === 0) return 0;
        await redisClient.del(keys);
        console.log(`[CACHE PATTERN DELETE] ${pattern} (${keys.length} keys deleted)`);
        return keys.length;
    } catch (err) {
        console.warn(`[CACHE ERROR] pattern delete for "${pattern}":`, err.message);
        return 0;
    }
}

export async function invalidateDashboardCache(companyId) {
    return deleteCachePattern(`dashboard:company:${companyId}:*`);
}

export async function invalidateEmployeeCache(companyId) {
    return deleteCachePattern(`employees:company:${companyId}:*`);
}

export async function invalidateUserCache(userId) {
    return deleteCachePattern(`user:${userId}:*`);
}

export async function invalidatePayslipCache(companyId) {
    return deleteCachePattern(`payslips:company:${companyId}:*`);
}

export async function invalidateAttendanceCache(userId) {
    return deleteCachePattern(`attendance:user:${userId}:*`);
}

export function getDashboardStatsCacheKey(companyId) {
    return `dashboard:company:${companyId}:stats`;
}

export function getDashboardEmployerCostCacheKey(companyId, year) {
    return `dashboard:company:${companyId}:employer-cost:${year}`;
}

export function getDashboardEmployeeCountCacheKey(companyId, year) {
    return `dashboard:company:${companyId}:employee-count:${year}`;
}

export function getDashboardWarningsCacheKey(companyId) {
    return `dashboard:company:${companyId}:warnings`;
}

export function getEmployeeDirectoryCacheKey(companyId, page, limit, filters = {}) {
    const filterStr = JSON.stringify(filters);
    const filterHash = Buffer.from(filterStr).toString('base64').slice(0, 20);
    return `employees:company:${companyId}:page:${page}:limit:${limit}:filters:${filterHash}`;
}

export function getUserProfileCacheKey(userId) {
    return `user:${userId}:profile`;
}

export function getUserCacheKey(userId) {
    return `user:${userId}:basic`;
}

export function getCompanyCacheKey(companyId) {
    return `company:${companyId}`;
}

export function getPayslipsListCacheKey(companyId, page, limit, filters = {}) {
    const filterStr = JSON.stringify(filters);
    const filterHash = Buffer.from(filterStr).toString('base64').slice(0, 20);
    return `payslips:company:${companyId}:page:${page}:limit:${limit}:filters:${filterHash}`;
}

export function getPayslipCacheKey(payslipId) {
    return `payslip:${payslipId}`;
}

export function getAttendanceCacheKey(userId, month) {
    return `attendance:user:${userId}:month:${month}`;
}

export function getCacheExpiry(type) {
    const expiryMap = {
        dashboard: DASHBOARD_EXPIRY,
        employee: EMPLOYEE_EXPIRY,
        company: COMPANY_EXPIRY,
        user: USER_EXPIRY,
        payslip: PAYSLIP_EXPIRY,
        attendance: ATTENDANCE_EXPIRY,
        default: DEFAULT_EXPIRY,
    };
    return expiryMap[type] || DEFAULT_EXPIRY;
}

export async function cacheWrapper(key, fetchFn, expiry = DEFAULT_EXPIRY) {
    const cached = await getCache(key);
    if (cached !== null) {
        return cached;
    }

    const data = await fetchFn();

    if (data !== null && data !== undefined) {
        await setCache(key, data, expiry);
    }

    return data;
}

export const CACHE_EXPIRY = {
    DASHBOARD: DASHBOARD_EXPIRY,
    EMPLOYEE: EMPLOYEE_EXPIRY,
    COMPANY: COMPANY_EXPIRY,
    USER: USER_EXPIRY,
    PAYSLIP: PAYSLIP_EXPIRY,
    ATTENDANCE: ATTENDANCE_EXPIRY,
    DEFAULT: DEFAULT_EXPIRY,
};

export default {
    setCache,
    getCache,
    deleteCache,
    deleteCachePattern,
    invalidateDashboardCache,
    invalidateEmployeeCache,
    invalidateUserCache,
    invalidatePayslipCache,
    invalidateAttendanceCache,
    cacheWrapper,
    getDashboardStatsCacheKey,
    getDashboardEmployerCostCacheKey,
    getDashboardEmployeeCountCacheKey,
    getDashboardWarningsCacheKey,
    getEmployeeDirectoryCacheKey,
    getUserProfileCacheKey,
    getUserCacheKey,
    getCompanyCacheKey,
    getPayslipsListCacheKey,
    getPayslipCacheKey,
    getAttendanceCacheKey,
    getCacheExpiry,
    CACHE_EXPIRY,
};
