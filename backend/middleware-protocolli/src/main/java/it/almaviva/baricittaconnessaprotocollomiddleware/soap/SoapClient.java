package it.almaviva.baricittaconnessaprotocollomiddleware.soap;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ws.client.core.support.WebServiceGatewaySupport;

import javax.xml.bind.JAXBElement;

@Log4j2
public class SoapClient extends WebServiceGatewaySupport {

    @Value("${soap.bari.uri}")
    private String soapBaseUri;

    @SuppressWarnings("unchecked")
    public <I,O> O doSyncRequest(I input){
        log.info("Request: "+input.toString());

        String protocolloUri = "/wsProtocol";
        JAXBElement<O> response =  (JAXBElement<O>) getWebServiceTemplate()
                .marshalSendAndReceive(soapBaseUri+ protocolloUri, input);
        return response.getValue();
    }
}
