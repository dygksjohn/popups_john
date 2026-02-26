// file: src/main/java/com/popups/pupoo/common/util/BcryptHashPrinter.java
package com.popups.pupoo.common.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptHashPrinter {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode("1234"));
    }
}