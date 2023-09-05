package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.DestinatariDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.ErroreDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.ProtocolloRequestDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.ProtocolloResponseDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.Allegato;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.Documento;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.Errore;
import it.almaviva.baricittaconnessaprotocollomiddleware.exception.AllegatiException;
import it.almaviva.baricittaconnessaprotocollomiddleware.exception.BadRequestException;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.xml.datatype.XMLGregorianCalendar;
import java.io.IOException;
import java.io.InputStream;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Log4j2
public class ProtocolloUtil {
    @Value("${flagControlloAllegati}")
    private boolean flagControlloAllegati;

    @Value("${maxDimAllegatiProtocolloKb}")
    private double maxDimAllegatiProtocolloKb;

    //@Value("${mapFileExtensions}")
    private Map<String, String> mapFileExtensions=new HashMap<>();

    {
        mapFileExtensions.put("application/pdf", ".pdf");
        mapFileExtensions.put("image/jpeg", ".jpg");
        mapFileExtensions.put("image/pjpeg", ".jpg");
        mapFileExtensions.put("image/png", ".png");
        mapFileExtensions.put("application/msword", ".doc");
        mapFileExtensions.put("application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx");
    }

    /**
     *
     * @param contenuto
     * @return
     */
    public byte[] decode(byte[] contenuto){
        byte[] decoded = Base64.getDecoder().decode(contenuto);

        return decoded;
    }

    public List<Allegato> buildAllegati(List<MultipartFile> allegati, boolean decode, boolean overrideNomeFile) {
        List<Allegato> _allegati = new ArrayList<Allegato>();

        if(flagControlloAllegati){
            if (allegati != null && allegati.size() > 0) {
                allegati.forEach(multipartFile -> {
                    try {

                        InputStream initialStream = multipartFile.getInputStream();
                        byte[] buffer = new byte[initialStream.available()];
                        initialStream.read(buffer);

                        Allegato allegato = new Allegato();

                        Documento documento = new Documento();

                        if(decode){
                            buffer = decode(buffer);
                        }

                        documento.setContenuto(buffer);
                        documento.setTitolo(multipartFile.getOriginalFilename());
                        documento.setNomeFile(multipartFile.getOriginalFilename());

                        //use case GPC
                        if(overrideNomeFile){
                            log.debug("################################ Recupero estensione file per contentType "+multipartFile.getContentType());

                            String nomeFile="documento_"+System.currentTimeMillis();

                            if(mapFileExtensions!=null&&mapFileExtensions.containsKey(multipartFile.getContentType())){
                                nomeFile+=mapFileExtensions.get(multipartFile.getContentType());
                            }

                            documento.setNomeFile(nomeFile);
                        }

                        allegato.setDocumento(documento);

                        _allegati.add(allegato);
                    } catch (IOException e) {
                        e.printStackTrace();
                        throw new IllegalArgumentException("Problema lettura file ");
                    }
                });
            }

        }

        return _allegati;
    }

    /**
     * Verifica dimensione file
     * @param allegati
     */
    public void checkFileSize(List<MultipartFile> allegati) {
        //QUESTA COSA SAREBBE UN DUPLICATO VISTO CHE E' GESTIBILE BENISSIMO TRAMITE SPRING MA INTANTO LA METTO
        AtomicInteger totalSize=new AtomicInteger(0);

        if(flagControlloAllegati && allegati !=null && allegati.size()>0){
            allegati.forEach(allegato->{
                try {
                    totalSize.addAndGet(allegato.getBytes().length);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });
            if(totalSize.get()/1024>maxDimAllegatiProtocolloKb){
                throw new AllegatiException(String.format("Dimensione allegati maggiore a quella consentita [MAX: %s kb]", maxDimAllegatiProtocolloKb));
            }
        }
    }

    public ProtocolloRequestDTO buildProtocolloRequestDTO(String istanza, String comunicazioneCittadino, String destinatari, String uoid) {
        ProtocolloRequestDTO protocolloRequestDTO = new ProtocolloRequestDTO();

        ObjectMapper objMapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        try {
            protocolloRequestDTO = objMapper.readValue(istanza, ProtocolloRequestDTO.class);

            if (comunicazioneCittadino != null && comunicazioneCittadino.length() > 0) {
                protocolloRequestDTO.setComunicazioneCittadino(Boolean.valueOf(comunicazioneCittadino));
            }

            if (destinatari != null && destinatari.length() > 0) {

                List<DestinatariDTO> dest = objMapper.readValue(destinatari, new TypeReference<List<DestinatariDTO>>() {
                });

                protocolloRequestDTO.setDestinatari(dest);
            }

            protocolloRequestDTO.setUoid(uoid);

        } catch (JsonProcessingException e) {
            //return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Parametri input errati");
            throw new BadRequestException("Parametri input errati");
        }
        return protocolloRequestDTO;
    }

    public ProtocolloResponseDTO buildProtocolloResponseDTO(Long numeroProtocollo, int anno, XMLGregorianCalendar dataProtocollo, Errore errore){
        ProtocolloResponseDTO protocolloResponseDTO = new ProtocolloResponseDTO();

        if(errore==null){
            protocolloResponseDTO.setNumeroProtocollo(numeroProtocollo);
            protocolloResponseDTO.setAnno(anno);

            if(dataProtocollo!=null){
                Date date = dataProtocollo.toGregorianCalendar().getTime();

                protocolloResponseDTO.setDataProtocollo(date.toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime());
            }

        }else{
            protocolloResponseDTO.setErrore(new ErroreDTO(errore.getCodice(), errore.getDescrizione()));
        }

        return protocolloResponseDTO;
    }

}
