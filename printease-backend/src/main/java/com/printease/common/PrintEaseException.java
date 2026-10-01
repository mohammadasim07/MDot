package com.printease.common;

/**
 * Base exception for all PrintEase application errors.
 */
public class PrintEaseException extends RuntimeException {

    private final String errorCode;

    public PrintEaseException(String message) {
        super(message);
        this.errorCode = "GENERAL_ERROR";
    }

    public PrintEaseException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public PrintEaseException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}
