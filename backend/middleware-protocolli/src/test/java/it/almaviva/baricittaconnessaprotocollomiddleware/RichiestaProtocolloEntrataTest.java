package it.almaviva.baricittaconnessaprotocollomiddleware;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.http.ContentType;
import io.restassured.internal.mapping.Jackson2Mapper;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.Allegato;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.Documento;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.RichiestaProtocollo;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.RichiestaProtocolloResponse;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.web.ProtocolloEntrataWebRequest;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.web.ProtocolloEntrataWebResponse;
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

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Collections;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;

@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Log4j2
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
public class RichiestaProtocolloEntrataTest extends TestCase {

    @Autowired
    ProtocolloController protocolloController;

    @Autowired
    SoapClient soapClient;

    private String a = "{\n" +
            "\"protocolloRequest\": {\n" +
            "\"mittente\": {\n" +
            "\"personaFisica\": {\n" +
            "\"nome\": \"Mario\",\n" +
            "\"cognome\": \"Rossi\",\n" +
            "\"codiceFiscale\": \"RSSMRA80A01A662A\"\n" +
            "}\n" +
            "},\n" +
            "\"documento\": {\n" +
            "\"nomeFile\": \"PraticaRichiestaConcessione.json\",\n" +
            "\"contenuto\": \"aaaaaaaaaaaaaaaaaaaaaaaaaaa\"\n" +
            "},\n" +
            "\"areaOrganizzativaOmogenea\": \"c_a662\",\n" +
            "\"amministrazione\": \"c_a662\",\n" +
            "\"oggetto\": \"Concessione RSSMRA80A01A662A – Richiesta cittadino\",\n" +
            "\"idUtente\": 2645\n" +
            "}\n" +
            "}";


    @Test
    public void testByWeb(){
        ProtocolloEntrataWebRequest request = composeRichiestaEntrataWebRequest();
        //printJson(request);
        ProtocolloEntrataWebResponse response = given().standaloneSetup(protocolloController)
                .contentType(ContentType.JSON)
                .body(composeRichiestaEntrataWebRequest(),objectMapper)
                .when()
                .post("/middleware/v1/protocollo/richiesta/entrata")
                .then()
                .statusCode(200)
                .extract().body().as(ProtocolloEntrataWebResponse.class);
        //printJson(response);
    }

    private ProtocolloEntrataWebRequest composeRichiestaEntrataWebRequest() {
        ProtocolloEntrataWebRequest protocolloEntrataWebRequest = new ProtocolloEntrataWebRequest();

        RichiestaProtocollo.ProtocolloRequest protocolloRequest = new RichiestaProtocollo.ProtocolloRequest();

        protocolloRequest.setMittente(null);
        protocolloRequest.setDocumento(composeDocumento());
        protocolloRequest.setAllegati(Collections.singletonList(composeAllegato()));
        protocolloRequest.setAreaOrganizzativaOmogenea("c_a662");
        protocolloRequest.setAmministrazione("c_a662");
        protocolloRequest.setOggetto("Test Maldarelli 4");
        protocolloRequest.setIdUtente(2094749);



        protocolloEntrataWebRequest.setProtocolloRequest(protocolloRequest);
        return protocolloEntrataWebRequest;
    }

    private Allegato composeAllegato() {
        Allegato allegato = new Allegato();
        allegato.setDocumento(composeDocumentoJpg());
        return allegato;
    }

    @SneakyThrows
    private Documento composeDocumentoJpg() {
        ClassLoader classLoader = getClass().getClassLoader();
        File file = new File(classLoader.getResource("passport.jpg").getFile());
        String absolutePath = file.getAbsolutePath();
        Documento documento = new Documento();
        documento.setTitolo("passport.jpg");
        documento.setNomeFile("passport.jpg");
        documento.setClassifica(null);
        documento.setContenuto(Files.readAllBytes(Paths.get(absolutePath)));
        return documento;
    }

    @SneakyThrows
    private Documento composeDocumento() {
        ClassLoader classLoader = getClass().getClassLoader();
        File file = new File(classLoader.getResource("tari.pdf").getFile());
        String absolutePath = file.getAbsolutePath();

        Documento documento = new Documento();
        documento.setTitolo("tari.pdf");
        documento.setNomeFile("tari.pdf");
        documento.setClassifica(null);
        documento.setContenuto(Files.readAllBytes(Paths.get(absolutePath)));
        return documento;
    }

    @Test
    public void testByService(){
        RichiestaProtocollo richiestaProtocollo = new RichiestaProtocollo();
        richiestaProtocollo.setProtocolloRequest(composeRichiestaEntrataWebRequest().getProtocolloRequest());
        RichiestaProtocolloResponse soapResponse = soapClient.doSyncRequest(richiestaProtocollo);
        System.out.println(soapResponse);
    }

    io.restassured.mapper.ObjectMapper objectMapper = new Jackson2Mapper(((type, charset) -> {
        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules();
        om.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return om;
    }));

    @SneakyThrows
    private <I> void printJson(I inputObject){
        ObjectMapper objectMapper = new ObjectMapper();
        String json = objectMapper.writeValueAsString(inputObject);
        log.info(json);
    }
}
