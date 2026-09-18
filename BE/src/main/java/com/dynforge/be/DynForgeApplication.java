package com.dynforge.be;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DynForgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(DynForgeApplication.class, args);
    }

}
