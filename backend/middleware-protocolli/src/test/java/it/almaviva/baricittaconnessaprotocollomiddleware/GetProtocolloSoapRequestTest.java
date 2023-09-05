package it.almaviva.baricittaconnessaprotocollomiddleware;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.http.ContentType;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.GetProtocollo;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.GetProtocolloResponse;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.web.GetProtocolloWebResponse;
import it.almaviva.baricittaconnessaprotocollomiddleware.rest.ProtocolloController;
import it.almaviva.baricittaconnessaprotocollomiddleware.soap.SoapClient;
import junit.framework.TestCase;
import lombok.SneakyThrows;
import lombok.extern.log4j.Log4j2;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;

@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Log4j2
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
public class GetProtocolloSoapRequestTest extends TestCase {

    @Autowired
    ProtocolloController protocolloController;

    @Autowired
    SoapClient soapClient;

    @Test
    public void testByWeb(){
        GetProtocolloWebResponse response = given().standaloneSetup(protocolloController)
                .contentType(ContentType.JSON)
                .when()
                .get("/middleware/v1/protocollo/numero/5/anno/2021")
                .then()
                .statusCode(200)
                .extract().body().as(GetProtocolloWebResponse.class);
        printJson(response);
    }

    @Test
    public void testByService(){
        GetProtocollo getProtocolloSoapRequest = new GetProtocollo();

        GetProtocollo.ProtocolloInformazioniRequest getProtocolloRequestContent = new GetProtocollo.ProtocolloInformazioniRequest();
        getProtocolloRequestContent.setNumeroProtocollo(5);
        getProtocolloRequestContent.setAnno("2021");
        getProtocolloSoapRequest.setProtocolloInformazioniRequest(getProtocolloRequestContent);
        GetProtocolloResponse result = soapClient.doSyncRequest(getProtocolloSoapRequest);
        System.out.println(result);
    }

    @SneakyThrows
    private <I> void printJson(I inputObject){
        ObjectMapper objectMapper = new ObjectMapper();
        String json = objectMapper.writeValueAsString(inputObject);
        log.info(json);
    }

}
