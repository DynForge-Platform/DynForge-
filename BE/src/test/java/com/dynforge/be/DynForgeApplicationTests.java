package com.dynforge.be;

import com.dynforge.be.service.MailService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@ActiveProfiles("test")
class DynForgeApplicationTests {

    @MockitoBean
    private MailService mailService;

    @Test
    void contextLoads() {
    }

}



