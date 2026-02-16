// src/main/java/com/popups/pupoo/common/api/ApiResponse.java
package com.popups.pupoo.common.api;

public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ErrorResponse error;

    public ApiResponse() {}

    private ApiResponse(boolean success, T data, ErrorResponse error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> fail(ErrorResponse error) {
        return new ApiResponse<>(false, null, error);
    }

    public boolean isSuccess() { return success; }
    public T getData() { return data; }
    public ErrorResponse getError() { return error; }

    public void setSuccess(boolean success) { this.success = success; }
    public void setData(T data) { this.data = data; }
    public void setError(ErrorResponse error) { this.error = error; }
}
