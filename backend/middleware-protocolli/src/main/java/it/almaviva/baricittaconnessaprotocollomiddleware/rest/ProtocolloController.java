package it.almaviva.baricittaconnessaprotocollomiddleware.rest;

import io.swagger.annotations.ApiOperation;
import it.almaviva.baricittaconnessaprotocollomiddleware.config.ShowSwaggerAPI;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.ProtocolloRequestDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.ProtocolloResponseDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.Documento;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.Errore;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.util.ProtocolloUtil;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.web.*;
import it.almaviva.baricittaconnessaprotocollomiddleware.service.ProtocolloSoapService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;

@ShowSwaggerAPI
@RequiredArgsConstructor
@RestController
@RequestMapping(value = "/middleware/v1/protocollo", produces = {MediaType.APPLICATION_JSON_VALUE})
public class ProtocolloController extends AbstractController {
    @Value("${flagControlloAllegati}")
    private boolean flagControlloAllegati;
    @Value("${maxDimAllegatiProtocolloKb}")
    private double maxDimAllegatiProtocolloKb;

    private final ProtocolloSoapService protocolloSoapService;

    @Autowired
    private ProtocolloUtil protocolloUtil;

    @ApiOperation(
            value = "Richiesta protocollo uscita OSP",
            response = ProtocolloUscitaWebResponse.class,
            hidden = false)
    @PostMapping(value = "/richiesta/uscita/osp", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> richiestaProtocolloUscitaOSP(
            @RequestPart(value = "protocolloUscitaRequest", required = true) ProtocolloUscitaWebRequest protocolloUscitaRequest,
            @RequestPart(value = "allegati", required = false) List<MultipartFile> allegati) {

        protocolloUtil.checkFileSize(allegati);

        protocolloUscitaRequest.getProtocolloUscitaRequest().setAllegati(protocolloUtil.buildAllegati(allegati,true, false));

        Documento documento=protocolloUscitaRequest.getProtocolloUscitaRequest().getDocumento();

        documento.setContenuto(protocolloUtil.decode(documento.getContenuto()));

        ProtocolloUscitaWebResponse protocolloUscitaWebResponse = protocolloSoapService.richiestaProtocolloUscita(protocolloUscitaRequest);

        if (protocolloUscitaWebResponse.getReturn().getErrore()!=null||protocolloUscitaWebResponse.getReturn().getNumeroProtocollo()==null) {
            if(protocolloUscitaWebResponse.getReturn().getErrore()!=null){
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Errore in fase di protocollazione: "+protocolloUscitaWebResponse.getReturn().getErrore());
            }else{
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Errore in fase di protocollazione: il servizio di protocollazione non ha restituito nessun numero di protocollo");
            }

        }else{

            ProtocolloResponseDTO protocolloResponseDTO= protocolloUtil.buildProtocolloResponseDTO(
                    protocolloUscitaWebResponse.getReturn().getNumeroProtocollo(),
                    protocolloUscitaWebResponse.getReturn().getAnno(),
                    protocolloUscitaWebResponse.getReturn().getDataProtocollo(),
                    protocolloUscitaWebResponse.getReturn().getErrore());

            return ResponseEntity.status(HttpStatus.OK).body(protocolloResponseDTO);
        }

    }

    @ApiOperation(
            value = "Richiesta protocollo entrata OSP",
            response = ProtocolloResponseDTO.class,
            hidden = false)
    @PostMapping(value = "/richiesta/entrata/osp", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> richiestaProtocolloEntrataOSP(
            @RequestPart(value = "protocolloEntrataRequest", required = true) ProtocolloEntrataWebRequest protocolloEntrataRequest,
            @RequestPart(value = "allegati", required = false) List<MultipartFile> allegati) {

        protocolloUtil.checkFileSize(allegati);

        protocolloEntrataRequest.getProtocolloRequest().setAllegati(protocolloUtil.buildAllegati(allegati,true, false));

        Documento documento=protocolloEntrataRequest.getProtocolloRequest().getDocumento();

        documento.setContenuto(protocolloUtil.decode(documento.getContenuto()));

        ProtocolloEntrataWebResponse protocolloEntrataWebResponse = protocolloSoapService.richiestaProtocolloEntrata(protocolloEntrataRequest);

        if (protocolloEntrataWebResponse.getReturn().getErrore()!=null||protocolloEntrataWebResponse.getReturn().getNumeroProtocollo()==null) {
            if(protocolloEntrataWebResponse.getReturn().getErrore()!=null){
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Errore in fase di protocollazione: "+protocolloEntrataWebResponse.getReturn().getErrore());
            }else{
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Errore in fase di protocollazione: il servizio di protocollazione non ha restituito nessun numero di protocollo");
            }

        }else{

            ProtocolloResponseDTO protocolloResponseDTO= protocolloUtil.buildProtocolloResponseDTO(
                    protocolloEntrataWebResponse.getReturn().getNumeroProtocollo(),
                    protocolloEntrataWebResponse.getReturn().getAnno(),
                    protocolloEntrataWebResponse.getReturn().getDataProtocollo(),
                    protocolloEntrataWebResponse.getReturn().getErrore());

            return ResponseEntity.status(HttpStatus.OK).body(protocolloResponseDTO);
        }
    }

    @ApiOperation(
            value = "Richiesta protocollo entrata GPC e EGOV",
            response = ProtocolloUscitaWebResponse.class,
            hidden = false)
    @PostMapping(value = "/richiesta/entrata_new", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> richiestaEntrata(@RequestPart(value = "istanza", required = true) String istanza,
                                              @RequestPart(value = "base64", required = true) String base64,
                                              @RequestPart(value = "destinatari", required = false) String destinatari,
                                              @RequestPart(value = "comunicazioneCittadino", required = false) String comunicazioneCittadino,
                                              @RequestPart(value = "uoid", required = false) String uoid,
                                              @RequestPart(value = "allegati", required = false) List<MultipartFile> allegati) {

        ProtocolloRequestDTO protocolloRequestDTO = protocolloUtil.buildProtocolloRequestDTO(istanza, comunicazioneCittadino, destinatari, uoid);

        protocolloUtil.checkFileSize(allegati);

        ProtocolloEntrataWebResponse protocolloEntrataWebResponse = protocolloSoapService.richiestaProtocolloEntrata(protocolloRequestDTO, base64, ".pdf", allegati);

        Errore protocolloError = protocolloEntrataWebResponse.getReturn().getErrore();

        if (protocolloError != null && protocolloError.getCodice().equals("100")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(protocolloEntrataWebResponse);
        }

        return ResponseEntity.status(HttpStatus.OK).body(protocolloEntrataWebResponse);
    }

    @ApiOperation(
            value = "Richiesta protocollo uscita GPC e EGOV",
            response = ProtocolloUscitaWebResponse.class,
            hidden = false)
    @PostMapping(value = "/richiesta/uscita_new", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> richiestaUscita(@RequestPart(value = "istanza", required = true) String istanza,
                                             @RequestPart(value = "base64", required = true) String base64,
                                             @RequestPart(value = "estensioneBase64", required = true) String estensioneBase64,
                                             @RequestPart(value = "destinatari", required = false) String destinatari,
                                             @RequestPart(value = "comunicazioneCittadino", required = false) String comunicazioneCittadino,
                                             @RequestPart(value = "uoid", required = false) String uoid,
                                             @RequestPart(value = "allegati", required = false) List<MultipartFile> allegati) {

        ProtocolloRequestDTO protocolloRequestDTO = protocolloUtil.buildProtocolloRequestDTO(istanza, comunicazioneCittadino, destinatari, uoid);

        protocolloUtil.checkFileSize(allegati);

        ProtocolloUscitaWebResponse protocolloUscitaWebResponse = protocolloSoapService.richiestaProtocolloUscita(protocolloRequestDTO, base64, estensioneBase64, allegati);

        Errore protocolloError = protocolloUscitaWebResponse.getReturn().getErrore();
        if (protocolloError != null && protocolloError.getCodice().equals("100")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(protocolloUscitaWebResponse);
        }

        return ResponseEntity.status(HttpStatus.OK).body(protocolloUscitaWebResponse);
    }

    @GetMapping("/numero/{number}/anno/{year}")
    public ResponseEntity<GetProtocolloWebResponse> getProtocollo(@PathVariable("number") String protocolNumber, @PathVariable("year") String year) {
        GetProtocolloWebResponse getProtocolloWebResponse = protocolloSoapService.getProtocollo(protocolNumber, year);

        Errore protocolloError = getProtocolloWebResponse.getReturn().getErrore();
        if (protocolloError != null && protocolloError.getCodice().equals("100")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(getProtocolloWebResponse);
        }

        return ResponseEntity.status(HttpStatus.OK).body(getProtocolloWebResponse);
    }

    @ApiOperation(
            value = "Richiesta protocollo entrata ",
            response = ProtocolloEntrataWebResponse.class,
            hidden = false)
    @PostMapping("/richiesta/entrata")
    public ResponseEntity<ProtocolloEntrataWebResponse> richiestaProtocollo(@RequestBody ProtocolloEntrataWebRequest protocolloEntrataRequest) {
        ProtocolloEntrataWebResponse protocolloEntrataWebResponse = protocolloSoapService.richiestaProtocolloEntrata(protocolloEntrataRequest);

        Errore protocolloError = protocolloEntrataWebResponse.getReturn().getErrore();
        if (protocolloError != null && protocolloError.getCodice().equals("100")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(protocolloEntrataWebResponse);
        }

        return ResponseEntity.status(HttpStatus.OK).body(protocolloEntrataWebResponse);
    }

    @ApiOperation(
            value = "Richiesta protocollo uscita ",
            response = ProtocolloUscitaWebResponse.class,
            hidden = false)
    @PostMapping("/richiesta/uscita")
    public ResponseEntity<ProtocolloUscitaWebResponse> richiestaProtocolloUscita(@RequestBody ProtocolloUscitaWebRequest protocolloUscitaWebRequest) {
        ProtocolloUscitaWebResponse protocolloUscitaWebResponse = protocolloSoapService.richiestaProtocolloUscita(protocolloUscitaWebRequest);

        Errore protocolloError = protocolloUscitaWebResponse.getReturn().getErrore();
        if (protocolloError != null && protocolloError.getCodice().equals("100")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(protocolloUscitaWebResponse);
        }

        return ResponseEntity.status(HttpStatus.OK).body(protocolloUscitaWebResponse);
    }
}
