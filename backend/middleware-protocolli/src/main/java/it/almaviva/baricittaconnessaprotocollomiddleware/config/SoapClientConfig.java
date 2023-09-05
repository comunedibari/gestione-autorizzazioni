package it.almaviva.baricittaconnessaprotocollomiddleware.config;

import it.almaviva.baricittaconnessaprotocollomiddleware.soap.SoapClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.springframework.ws.transport.http.HttpComponentsMessageSender;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class SoapClientConfig {

    @Bean
    public Jaxb2Marshaller marshaller() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setPackagesToScan("it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap");
        Map<String,Object> map = new HashMap<>();
        map.put("jaxb.formatted.output", true);
        marshaller.setMarshallerProperties(map);
        return marshaller;
    }

    @Bean
    public HttpComponentsMessageSender httpComponentsMessageSender() {
        HttpComponentsMessageSender sender = new HttpComponentsMessageSender();
        sender.setConnectionTimeout(600000);

        sender.setReadTimeout(600000);

        return sender;
    }

    @Bean
    public SoapClient soapClient(Jaxb2Marshaller marshaller, HttpComponentsMessageSender httpComponentsMessageSender) {
        SoapClient client = new SoapClient();
        client.setDefaultUri("http://localhost:8080/ws");
        client.setMarshaller(marshaller);
        client.setUnmarshaller(marshaller);
        client.setMessageSender(httpComponentsMessageSender);

        return client;
    }

}
