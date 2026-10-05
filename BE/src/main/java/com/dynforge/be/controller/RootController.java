package com.dynforge.be.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "status", "UP",
                "app", "DynForge Platform API",
                "version", "0.0.1"
        );
    }
}
