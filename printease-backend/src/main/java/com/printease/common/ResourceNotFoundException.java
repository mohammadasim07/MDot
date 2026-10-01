package com.printease.common;

public class ResourceNotFoundException extends PrintEaseException {
    public ResourceNotFoundException(String resourceType, String id) {
        super("NOT_FOUND", resourceType + " not found with id: " + id);
    }
}
