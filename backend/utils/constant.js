export function successResponse(data = null, message = 'OK') {
    return {
        success: true,
        message,
        data,
    };
}

export function errorResponse(message = 'Error', data = null) {
    return {
        success: false,
        message,
        data,
    };
}
