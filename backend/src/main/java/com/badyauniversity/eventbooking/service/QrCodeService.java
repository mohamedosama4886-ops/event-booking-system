package com.badyauniversity.eventbooking.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.UUID;

/**
 * Generates a stable per-student QR payload and PNG image stored as a data URL.
 */
@Service
public class QrCodeService {

    private static final int QR_SIZE = 256;

    public String newStudentToken() {
        return UUID.randomUUID().toString();
    }

    /**
     * PNG as data URL; {@code payload} is what scanners read (the unique student token).
     */
    public String encodeToPngDataUrl(String payload) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(payload, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            String b64 = Base64.getEncoder().encodeToString(out.toByteArray());
            return "data:image/png;base64," + b64;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code image", e);
        }
    }
}
