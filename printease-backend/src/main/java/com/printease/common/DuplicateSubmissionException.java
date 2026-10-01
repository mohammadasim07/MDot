package com.printease.common;

public class DuplicateSubmissionException extends PrintEaseException {
    public DuplicateSubmissionException(String idempotencyKey) {
        super("DUPLICATE_SUBMISSION", "A job with this idempotency key already exists: " + idempotencyKey);
    }
}
