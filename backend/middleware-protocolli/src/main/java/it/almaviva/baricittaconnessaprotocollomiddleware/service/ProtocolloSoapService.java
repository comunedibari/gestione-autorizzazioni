package it.almaviva.baricittaconnessaprotocollomiddleware.service;

import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.ProtocolloRequestDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.web.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


public interface ProtocolloSoapService {
  GetProtocolloWebResponse getProtocollo(String protocolNumber, String year);

  ProtocolloEntrataWebResponse richiestaProtocolloEntrata(ProtocolloEntrataWebRequest protocolloEntrataRequest);

  ProtocolloEntrataWebResponse richiestaProtocolloEntrata(ProtocolloRequestDTO protocolloEntrataRequest, String base64, String estensioneBase64, List<MultipartFile> allegati);

  ProtocolloUscitaWebResponse richiestaProtocolloUscita(ProtocolloUscitaWebRequest protocolloUscitaWebRequest);

  ProtocolloUscitaWebResponse richiestaProtocolloUscita(ProtocolloRequestDTO protocolloUscitaRequest, String base64, String estensioneBase64, List<MultipartFile> allegati);
}
