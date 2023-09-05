package it.almaviva.baricittaconnessaprotocollomiddleware;

import com.fasterxml.jackson.module.afterburner.AfterburnerModule;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class Application {

    public static void main(String[] args){
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public AfterburnerModule afterburnerModule(){
        return new AfterburnerModule();
    }
}
