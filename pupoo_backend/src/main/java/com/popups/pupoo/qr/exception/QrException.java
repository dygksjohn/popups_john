package com.popups.pupoo.qr.exception;

/**
 * Exception thrown when QR related operations fail. In the real project
 * specific error codes would be provided; here we use a simple runtime
 * exception with a message.
 */
public class QrException extends RuntimeException {
    public QrException(String message) {
        super(message);
    }
}