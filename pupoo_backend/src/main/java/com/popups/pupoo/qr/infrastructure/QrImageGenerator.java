// file: src/main/java/com/popups/pupoo/qr/infrastructure/QrImageGenerator.java
package com.popups.pupoo.qr.infrastructure;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.EnumMap;
import java.util.Map;

@Component
public class QrImageGenerator {

    public byte[] generatePng(String content, int size) {
        if (content == null || content.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "qr content is required");
        }
        if (size <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "size must be positive");
        }

        try {
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.MARGIN, 1);

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size, hints);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (WriterException | IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to generate QR image: " + e.getMessage());
        }
    }
}
