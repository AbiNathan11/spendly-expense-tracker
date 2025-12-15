/**
 * Response formatter utilities
 */

const successResponse = (data, message = null) => {
    const response = {
        success: true,
        data
    };

    if (message) {
        response.message = message;
    }

    return response;
};

const errorResponse = (error, statusCode = 500) => {
    return {
        success: false,
        error: typeof error === 'string' ? error : error.message,
        statusCode
    };
};

const paginateResponse = (data, page, limit, total) => {
    return {
        success: true,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total
        }
    };
};

module.exports = {
    successResponse,
    errorResponse,
    paginateResponse
};
