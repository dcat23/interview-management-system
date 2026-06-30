package xyz.catuns.imp.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import xyz.catuns.spring.jwt.autoconfigure.annotation.EnableJwtSecurity;

@EnableJwtSecurity
@SpringBootApplication
public class ApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }

}
