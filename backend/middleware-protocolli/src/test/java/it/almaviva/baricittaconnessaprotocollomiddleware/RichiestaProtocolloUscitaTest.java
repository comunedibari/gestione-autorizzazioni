package it.almaviva.baricittaconnessaprotocollomiddleware;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.http.ContentType;
import io.restassured.internal.mapping.Jackson2Mapper;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ContattoDestinatario;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.Documento;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.RichiestaProtocolloUscita;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.RichiestaProtocolloUscitaResponse;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.web.ProtocolloUscitaWebRequest;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.web.ProtocolloUscitaWebResponse;
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

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.util.LinkedList;
import java.util.List;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;

@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Log4j2
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
public class RichiestaProtocolloUscitaTest extends TestCase {

    @Autowired
    ProtocolloController protocolloController;

    @Autowired
    SoapClient soapClient;

    private String a = "{\"protocolloUscitaRequest\":{\"destinatari\":[{\"codiceFiscale\":\"RSSMRA80A01A662A\",\"cognome\":\"Rossi\",\"nome\":\"Mario\"},{\"piva\":\"06655971007\",\"ragioneSociale\":\"ENEL ENERGIA S.P.A.\"}],\"documento\":{\"nomeFile\":\"PraticaRichiestaPareri.json\",\"contenuto\":\"YWFhYWFhYWFhYWFhYWFhYQ==\"},\"areaOrganizzativaOmogenea\": \"c_a662\", \"amministrazione\":\"c_a662\",\"oggetto\":\"Concessione RSSMRA80A01A662A – Richiesta pareri\",\"idUtente\":2645}}";

    private String c = "{\n" +
            "   \"documento\":{\n" +
            "      \"nomeFile\":\"PraticaConcessioneValida.json\",\n" +
            "      \"contenuto\":\"eyJpZCI6NywiaWRQcmF0aWNhT3JpZ2luYXJpYSI6bnVsbCwiaWRQcm9yb2dhUHJlY2VkZW50ZSI6bnVsbCwibW90aXZhemlvbmVSaWNoaWVzdGEiOm51bGwsImRhdGlSaWNoaWVzdGEiOnsiaWQiOjcsInViaWNhemlvbmVPY2N1cGF6aW9uZSI6IlZJQSBQSVRBR09SQSwgLS0gKE1VTklDSVBJTyBOLjEpIC0gVE9SUkUgQSBNQVJFIiwiaWRNdW5pY2lwaW8iOjEsImxvY2FsaXRhIjoiVE9SUkUgQSBNQVJFIiwiZmxhZ051bWVyb0Npdmljb0Fzc2VudGUiOnRydWUsIm5vdGVVYmljYXppb25lIjoiYXNzZW56YSBjaXZpY28iLCJzdXBlcmZpY2llQXJlYU1xIjo0LjAsImxhcmdoZXp6YU0iOjIuMCwibHVuZ2hlenphTSI6Mi4wLCJzdXBlcmZpY2llTWFyY2lhcGllZGVNcSI6Mi4wLCJsYXJnaGV6emFNYXJjaWFwaWVkZU0iOjEuMCwibHVuZ2hlenphTWFyY2lhcGllZGVNIjoxLjAsImxhcmdoZXp6YUNhcnJlZ2dpYXRhTSI6bnVsbCwibHVuZ2hlenphQ2FycmVnZ2lhdGFNIjpudWxsLCJzdGFsbG9EaVNvc3RhIjpmYWxzZSwicHJlc1NjaXZvbGlEaXZlcnNhbWVudGVBYmlsaSI6ZmFsc2UsInByZXNQYXNzaUNhcnJhYmlsaURpdmVyc2FtZW50ZUFiaWxpIjpmYWxzZSwiZGF0YUluaXppb09jY3VwYXppb25lIjpbMjAyMiw2LDI2XSwib3JhSW5pemlvT2NjdXBhemlvbmUiOm51bGwsImRhdGFTY2FkZW56YU9jY3VwYXppb25lIjpbMjAyMiw2LDMwXSwib3JhU2NhZGVuemFPY2N1cGF6aW9uZSI6bnVsbCwiaWRBdHRpdml0YURhU3ZvbGdlcmUiOjEsImlkVGlwb2xvZ2lhVGl0b2xvRWRpbGl6aW8iOjEsImRlc2NyaXppb25lVGl0b2xvRWRpbGl6aW8iOm51bGwsInJpZmVyaW1lbnRvVGl0b2xvRWRpbGl6aW8iOiJyaWZlcmltZW50byBhc2N0ZCAwMy8yMDIyIiwiZGVzY3JpemlvbmVBdHRpdml0YURhU3ZvbGdlcmUiOm51bGwsImlkTWFudWZhdHRvIjoxLCJkZXNjcml6aW9uZU1hbnVmYXR0byI6bnVsbCwiZmxhZ0FjY2V0dGF6aW9uZVJlZ1N1b2xvUHViYmxpY28iOnRydWUsImZsYWdSaXNwZXR0b0ludGVyZXNzZVRlcnppIjp0cnVlLCJmbGFnT2JibGlnb1JpcGFyYXppb25lRGFubmkiOnRydWUsImZsYWdSaXNwZXR0b0Rpc3Bvc2l6aW9uaVJlZ29sYW1lbnRvIjp0cnVlLCJmbGFnQ29ub3NjZW56YVRhc3NhT2NjdXBhemlvbmUiOnRydWUsImZsYWdOb25Nb2RpZmljaGVSaXNwZXR0b0NvbmNlc3Npb25lIjpmYWxzZSwiY29vcmRVYmljYXppb25lVGVtcG9yYW5lYSI6eyJwb2ludHMiOlt7ImxvbiI6MTYuOTk1OTA5NiwibGF0Ijo0MS4wODc3NTd9XX0sImNvb3JkVWJpY2F6aW9uZURlZmluaXRpdmEiOnsicG9pbnRzIjpbey\n" +
            "Jsb24iOjE2Ljk5NTkwOTYsImxhdCI6NDEuMDg3NzU3fV19LCJ0aXBvT3BlcmF6aW9uZVZlcmlmaWNhT2NjdXBhemlvbmUiOiJPQ0NVUEFaSU9ORV9DT1JSRVRUQSIsIm5vbWVfdmlhIjoiVklBIFBJVEFHT1JBIiwibnVtZXJvIjpudWxsLCJjb2RfdmlhIjoiNzAwMDIxMjg2In0sImZpcm1hdGFyaW8iOnsiaWQiOjExLCJpZFRpcG9SdW9sb1JpY2hpZWRlbnRlIjoxLCJub21lIjoiU2ltb25lIiwiY29nbm9tZSI6IlJvc3NpIiwiZGVub21pbmF6aW9uZSI6bnVsbCwiY29kaWNlRmlzY2FsZVBhcnRpdGFJdmEiOiJSU1NTTU4wMEUwMEUwMDBFIiwiZGF0YURpTmFzY2l0YSI6WzE5ODIsNiwxMF0sImNvbXVuZURpTmFzY2l0YSI6ImJhcmkiLCJwcm92aW5jaWFEaU5hc2NpdGEiOiJCQSIsIm5hemlvbmFsaXRhIjoiaXQiLCJjaXR0YSI6ImJhcmkiLCJpbmRpcml6em8iOiJ2aWEgZGFudGUiLCJjaXZpY28iOiIyIiwicHJvdmluY2lhIjoiQkEiLCJjYXAiOiI3MDEwMCIsInJlY2FwaXRvVGVsZWZvbmljbyI6IjMzMzMzMzMzMzMiLCJlbWFpbCI6Im4ubm9jZXJpbm9AYWxtYXZpdmEuaXQiLCJpZFRpcG9Eb2N1bWVudG9BbGxlZ2F0byI6MSwibnVtZXJvRG9jdW1lbnRvQWxsZWdhdG8iOiIxMjM0NSIsImFtbWluaXN0cmF6aW9uZURvY3VtZW50b0FsbGVnYXRvIjoiY29tdW5lIGRpIGJhcmkiLCJmbGFnRmlybWF0YXJpbyI6ZmFsc2UsImZsYWdEZXN0aW5hdGFyaW8iOmZhbHNlfSwiZGVzdGluYXRhcmlvIjpudWxsLCJtdW5pY2lwaW8iOnsiaWQiOjEsImRlc2NyaXppb25lIjoiTXVuaWNpcGlvIDEifSwidXRlbnRlUHJlc2FJbkNhcmljbyI6eyJpZCI6NiwiaWRHcnVwcG8iOjQsImlkc011bmljaXBpIjpbMV0sInVzZXJuYW1lIjoiSXN0cnV0dG9yZU0xIiwibm9tZSI6IlBhb2xvIiwiY29nbm9tZSI6IlZlcmRpIiwic2Vzc28iOiJNIiwiZGF0YURpTmFzY2l0YSI6WzE5ODksNCwxXSwibHVvZ29EaU5hc2NpdGEiOiJCYXJpIiwicHJvdmluY2lhRGlOYXNjaXRhIjoiQkEiLCJjb2RpY2VGaXNjYWxlIjoiVlJEUExBODlEMDFBNjYySyIsInJhZ2lvbmVTb2NpYWxlIjoiTXVuaWNpcGlvIDEiLCJlbWFpbCI6Im4ubm9jZXJpbm9AYWxtYXZpdmEuaXQiLCJudW1UZWwiOiIzMzMzMzMzMzMzIiwiZW5hYmxlZCI6dHJ1ZSwiZGF0ZUNyZWF0ZWQiOlsyMDIyLDQsMzAsOSwzMSwzOF0sImxhc3RMb2dpbiI6WzIwMjIsNyw3LDE3LDUwLDM0XSwiZmxhZ0VsaW1pbmF0byI6ZmFsc2UsImRhdGFFbGltaW5hemlvbmUiOm51bGwsInVvSWQiOiIyNjQ1IiwiaW5kaXJpenpvIjpudWxsfSwidXRlbnRlQ3JlYXppb25lIjp7ImlkIjo2LCJpZEdydXBwbyI6NCwiaWRzTXVuaWNpcGkiOlsxXSwidXNlcm5hbWUiOiJJc3RydXR0b3JlTTEiLCJub21lIjoiUGFvbG8iLCJjb2dub21lIjoiVmVyZGkiLCJzZXNzbyI6Ik0iLCJkYXRhRGlOYXNjaXRhIjpbMTk4OSw0LDFdLCJsdW9nb0RpTmFzY2l0YSI6IkJhcmkiLCJwcm92aW5jaWFEaU5hc2NpdGEiOiJCQSIsImNvZGljZUZpc2NhbGUiOiJWUkRQTEE4OUQwMUE2NjJLIiwicmFnaW9uZVNvY2lhbGUiOiJNdW\n" +
            "5pY2lwaW8gMSIsImVtYWlsIjoibi5ub2Nlcmlub0BhbG1hdml2YS5pdCIsIm51bVRlbCI6IjMzMzMzMzMzMzMiLCJlbmFibGVkIjp0cnVlLCJkYXRlQ3JlYXRlZCI6WzIwMjIsNCwzMCw5LDMxLDM4XSwibGFzdExvZ2luIjpbMjAyMiw3LDcsMTcsNTAsMzRdLCJmbGFnRWxpbWluYXRvIjpmYWxzZSwiZGF0YUVsaW1pbmF6aW9uZSI6bnVsbCwidW9JZCI6IjI2NDUiLCJpbmRpcml6em8iOm51bGx9LCJ1dGVudGVNb2RpZmljYSI6eyJpZCI6NiwiaWRHcnVwcG8iOjQsImlkc011bmljaXBpIjpbMV0sInVzZXJuYW1lIjoiSXN0cnV0dG9yZU0xIiwibm9tZSI6IlBhb2xvIiwiY29nbm9tZSI6IlZlcmRpIiwic2Vzc28iOiJNIiwiZGF0YURpTmFzY2l0YSI6WzE5ODksNCwxXSwibHVvZ29EaU5hc2NpdGEiOiJCYXJpIiwicHJvdmluY2lhRGlOYXNjaXRhIjoiQkEiLCJjb2RpY2VGaXNjYWxlIjoiVlJEUExBODlEMDFBNjYySyIsInJhZ2lvbmVTb2NpYWxlIjoiTXVuaWNpcGlvIDEiLCJlbWFpbCI6Im4ubm9jZXJpbm9AYWxtYXZpdmEuaXQiLCJudW1UZWwiOiIzMzMzMzMzMzMzIiwiZW5hYmxlZCI6dHJ1ZSwiZGF0ZUNyZWF0ZWQiOlsyMDIyLDQsMzAsOSwzMSwzOF0sImxhc3RMb2dpbiI6WzIwMjIsNyw3LDE3LDUwLDM0XSwiZmxhZ0VsaW1pbmF0byI6ZmFsc2UsImRhdGFFbGltaW5hemlvbmUiOm51bGwsInVvSWQiOiIyNjQ1IiwiaW5kaXJpenpvIjpudWxsfSwidXRlbnRlQXNzZWduYXRhcmlvIjpudWxsLCJkYXRhQ3JlYXppb25lIjpbMjAyMiw2LDgsMTYsMzgsMjhdLCJkYXRhSW5zZXJpbWVudG8iOlsyMDIyLDYsOCwxNiwzOSw0MV0sImRhdGFNb2RpZmljYSI6WzIwMjIsNyw3LDE4LDMwLDQxXSwidGlwb1Byb2Nlc3NvIjp7ImlkIjoxLCJkZXNjcml6aW9uZSI6IkNvbmNlc3Npb25lIHRlbXBvcmFuZWEifSwic3RhdG9QcmF0aWNhIjp7ImlkIjoxMCwiZGVzY3JpemlvbmUiOiJDb25jZXNzaW9uZSB2YWxpZGEifSwiZmxhZ1ZlcmlmaWNhRm9ybWFsZSI6dHJ1ZSwiZmxhZ1Byb2NlZHVyYURpbmllZ28iOm51bGwsInByb3RvY29sbGkiOlt7ImlkIjoyMCwiaWRQcmF0aWNhIjo3LCJpZFN0YXRvUHJhdGljYSI6MSwiY29kaWNlUHJvdG9jb2xsbyI6IjRyb1hjOXkzemhENlA2aTd8MjAyMiIsImRhdGFQcm90b2NvbGxvIjpbMjAyMiw2LDgsMTYsMzksNDEsMjg3NTQxMDAwXSwidGlwb09wZXJhemlvbmUiOm51bGwsImNvZGljZURldGVybWluYVJldHRpZmljYSI6bnVsbCwiZGF0YUVtaXNzaW9uZURldGVybWluYVJldHRpZmljYSI6bnVsbH0seyJpZCI6MjEsImlkUHJhdGljYSI6NywiaWRTdGF0b1ByYXRpY2EiOjIsImNvZGljZVByb3RvY29sbG8iOiJCZDJtU0ZnMlZNWW9ZZlRVfDIwMjIiLCJkYXRhUHJvdG9jb2xsbyI6WzIwMjIsNiw4LDE2LDUzLDQ2LDI1OTE2MDAwXSwidGlwb09wZXJhemlvbmUiOm51bGwsImNvZGljZURldGVybWluYVJldHRpZmljYSI6bnVsbCwiZGF0YUVtaXNzaW9uZURldGVybWluYVJldHRpZmljYSI6bnVsbH0seyJpZCI6NjcsImlkUHJhdGljYSI6NywiaWRTdGF0b1ByYXRpY2EiOjgsImNvZGljZV\n" +
            "Byb3RvY29sbG8iOiJtOVZQaXJSS3ZISmEyeVA0fDIwMjIiLCJkYXRhUHJvdG9jb2xsbyI6WzIwMjIsNyw3LDE2LDMzLDU5LDg5ODQwMjAwMF0sInRpcG9PcGVyYXppb25lIjpudWxsLCJjb2RpY2VEZXRlcm1pbmFSZXR0aWZpY2EiOm51bGwsImRhdGFFbWlzc2lvbmVEZXRlcm1pbmFSZXR0aWZpY2EiOm51bGx9XSwiY29kaWNlRGV0ZXJtaW5hIjoiYWFhIiwiZGF0YUVtaXNzaW9uZURldGVybWluYSI6WzIwMjIsNyw3XSwiY29kaWNlRGV0ZXJtaW5hUmludW5jaWEiOm51bGwsImRhdGFFbWlzc2lvbmVEZXRlcm1pbmFSaW51bmNpYSI6bnVsbCwibm90YUFsQ2l0dGFkaW5vUmRhIjpudWxsLCJjb2RpY2VEZXRlcm1pbmFSZGEiOm51bGwsImRhdGFFbWlzc2lvbmVEZXRlcm1pbmFSZGEiOm51bGwsImRhdGFTY2FkZW56YVByYXRpY2EiOlsyMDIyLDgsNywxNiwzOSw0MV0sImRhdGFTY2FkZW56YVJpZ2V0dG8iOm51bGwsImRhdGFTY2FkZW56YVByZWF2dmlzb0RpbmllZ28iOm51bGwsImRhdGFTY2FkZW56YVBhZ2FtZW50byI6WzIwMjIsOCw2LDE2LDMzLDU5XSwiY29udGF0b3JlUmljaGllc3RlSW50ZWdyYXppb25pIjpudWxsLCJub21lQ2l0dGFkaW5vRWdvdiI6bnVsbCwiY29nbm9tZUNpdHRhZGlub0Vnb3YiOm51bGwsImNmQ2l0dGFkaW5vRWdvdiI6bnVsbCwicmljaGllc3RlUGFyZXJpIjpbeyJpZCI6MTUsImlkUHJhdGljYSI6NywiaWRVdGVudGVSaWNoaWVkZW50ZSI6NiwiaWRTdGF0b1ByYXRpY2EiOjIsImlkR3J1cHBvRGVzdGluYXRhcmlvUGFyZXJlIjo1LCJjb2RpY2VQcm90b2NvbGxvIjoiTzZPU21uQkpJWU1mdEFrenwyMDIyIiwiZGF0YVByb3RvY29sbG8iOlsyMDIyLDYsOCwxNiw1NCwxMywzNzY3NzMwMDBdLCJub3RhUmljaGllc3RhUGFyZXJlIjpudWxsLCJkYXRhSW5zZXJpbWVudG8iOlsyMDIyLDYsOCwxNiw1NCwxM10sImZsYWdJbnNlcml0YVJpc3Bvc3RhIjpmYWxzZSwicGFyZXJlIjpudWxsfSx7ImlkIjoxNiwiaWRQcmF0aWNhIjo3LCJpZFV0ZW50ZVJpY2hpZWRlbnRlIjo2LCJpZFN0YXRvUHJhdGljYSI6MiwiaWRHcnVwcG9EZXN0aW5hdGFyaW9QYXJlcmUiOjUsImNvZGljZVByb3RvY29sbG8iOiJpVzR6aEJMZWJzZHdMZ0Y4fDIwMjIiLCJkYXRhUHJvdG9jb2xsbyI6WzIwMjIsNiw4LDE2LDU2LDE4LDIzNTI1OTAwMF0sIm5vdGFSaWNoaWVzdGFQYXJlcmUiOm51bGwsImRhdGFJbnNlcmltZW50byI6WzIwMjIsNiw4LDE2LDU2LDE4XSwiZmxhZ0luc2VyaXRhUmlzcG9zdGEiOmZhbHNlLCJwYXJlcmUiOm51bGx9XSwicmljaGllc3RlSW50ZWdyYXppb25pIjpbXX0=\"\n" +
            "   },\n" +
            "   \"areaOrganizzativaOmogenea\":\"c_a662\",\n" +
            "   \"amministrazione\":\"c_a662\",\n" +
            "   \"oggetto\":\"Concessione temporanea RSSSMN00E00E000E - Stato Concessione valida - Mittente Municipio 1\",\n" +
            "   \"idUtente\":\"2645\",\n" +
            "   \"destinatari\":[\n" +
            "      {\n" +
            "         \"nome\":\"Simone\",\n" +
            "         \"cognome\":\"Rossi\",\n" +
            "         \"codiceFiscale\":\"RSSSMN00E00E000E\"\n" +
            "      }\n" +
            "   ]\n" +
            "}";

    @Test
    public void testByWeb() throws JsonProcessingException {
        ProtocolloUscitaWebRequest request = composeRichiestaUscitaWebRequest();
        printJson(request);
        ObjectMapper objectMapper1 = new ObjectMapper();
        RichiestaProtocolloUscita b = objectMapper1.readValue(c, RichiestaProtocolloUscita.class);
        ProtocolloUscitaWebResponse response = given().standaloneSetup(protocolloController)
                .contentType(ContentType.JSON)
                .body(b,objectMapper)
                .when()
                .post("/middleware/v1/protocollo/richiesta/uscita")
                .then()
                .statusCode(200)
                .extract().body().as(ProtocolloUscitaWebResponse.class);
        printJson(response);
    }

    @Test
    public void testByWeb404() throws JsonProcessingException {
        ProtocolloUscitaWebRequest request = composeRichiestaUscitaWebRequest();
        printJson(request);
        ObjectMapper objectMapper1 = new ObjectMapper();
        RichiestaProtocolloUscita b = objectMapper1.readValue(a, RichiestaProtocolloUscita.class);
        given().standaloneSetup(protocolloController)
                .contentType(ContentType.JSON)
                .body(b,objectMapper)
                .when()
                .post("/middleware/v1/protocollo/richiesta/protocolloRequestS")
                .then()
                .statusCode(404);
    }

    @Test
    public void testByService(){
        RichiestaProtocolloUscita richiestaProtocollo = new RichiestaProtocolloUscita();
        richiestaProtocollo.setProtocolloUscitaRequest(composeRichiestaUscitaWebRequest().getProtocolloUscitaRequest());
        RichiestaProtocolloUscitaResponse soapResponse = soapClient.doSyncRequest(richiestaProtocollo);
        System.out.println(soapResponse);
    }

    private ProtocolloUscitaWebRequest composeRichiestaUscitaWebRequest() {
        ProtocolloUscitaWebRequest protocolloUscitaWebRequest = new ProtocolloUscitaWebRequest();
        RichiestaProtocolloUscita.ProtocolloUscitaRequest protocolloUscitaRequest = new RichiestaProtocolloUscita.ProtocolloUscitaRequest();

        protocolloUscitaRequest.setDestinatari(composeDestinatari());
        protocolloUscitaRequest.setDocumento(composeDocumentoTxt());
        protocolloUscitaRequest.setAreaOrganizzativaOmogenea("c_a662");
        protocolloUscitaRequest.setAmministrazione("c_a662");
        protocolloUscitaRequest.setOggetto("Sospensione e divieto della prosecuzione dei lavori DLLLRD69T01A662E-060629-5174939");
        protocolloUscitaRequest.setIdUtente(13124239);


        protocolloUscitaWebRequest.setProtocolloUscitaRequest(protocolloUscitaRequest);

        return protocolloUscitaWebRequest;
    }

    private List<ContattoDestinatario> composeDestinatari() {
        List<ContattoDestinatario> contattoDestinatarioList = new LinkedList<>();
        contattoDestinatarioList.add(composeDestinatario("RSSMRA80A01H501U", "Rossi", "Mario"));
        contattoDestinatarioList.add(composeDestinatario("BNCLSU81A41H501C", "Bianchi", "Luisa"));
        contattoDestinatarioList.add(composeDestinatario("RSSNTN01A01H501X", "Rossi", "Antonio"));
        contattoDestinatarioList.add(composeDestinatario("RSSMRC05A01H501J", "Rossi", "Marco"));
        return contattoDestinatarioList;
    }

    private ContattoDestinatario composeDestinatario(String codiceFiscale, String cognome, String nome) {
        ContattoDestinatario contattoDestinatario = new ContattoDestinatario();
        contattoDestinatario.setCodiceFiscale(codiceFiscale);
        contattoDestinatario.setCognome(cognome);
        contattoDestinatario.setNome(nome);
        contattoDestinatario.setModalitaSpedizione(4);
        return contattoDestinatario;
    }


    @SneakyThrows
    private Documento composeDocumentoTxt() {
        ClassLoader classLoader = getClass().getClassLoader();
        File file = new File(classLoader.getResource("TestAllegato1.txt").getFile());
        String absolutePath = file.getAbsolutePath();
        Documento documento = new Documento();
        documento.setTitolo("TestAllegato1 Titolo");
        documento.setSunto("TestAllegato1 Sunto");
        documento.setDettaglio("TestAllegato1 Dettaglio");
        documento.setNomeFile("TestAllegato1.txt");
        documento.setContenuto(Files.readAllBytes(Paths.get(absolutePath)));
        return documento;
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
