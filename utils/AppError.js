class AppError extends Error {
    constructor(message, status) {
        super(status);
        this.status = status;
        this.message = message;
    }
}

module.exports = AppError;