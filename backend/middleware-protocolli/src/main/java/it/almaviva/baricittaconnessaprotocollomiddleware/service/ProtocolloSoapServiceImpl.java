package it.almaviva.baricittaconnessaprotocollomiddleware.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.ProtocolloRequestDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.RagioneSocialeDestinatariDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.UoidDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.*;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.util.ProtocolloUtil;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.web.*;
import it.almaviva.baricittaconnessaprotocollomiddleware.exception.ProtocolloException;
import it.almaviva.baricittaconnessaprotocollomiddleware.openfeign.OpenFeignClient;
import it.almaviva.baricittaconnessaprotocollomiddleware.soap.SoapClient;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.ws.client.WebServiceIOException;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@Log4j2
public class ProtocolloSoapServiceImpl implements ProtocolloSoapService {

  public static final String TIPOLOGIA_PERSONA_GIURIDICA = "G";
  private final SoapClient soapClient;
  private final OpenFeignClient openFeignClient;

  @Value("${codiceAmministrazione}")
  private String codiceAmministrazione;

  @Value("${flagControlloAllegati}")
  private boolean flagControlloAllegati;

  @Autowired
  private ProtocolloUtil protocolloUtil;

  public ProtocolloSoapServiceImpl(SoapClient soapClient, OpenFeignClient openFeignClient) {
    this.soapClient = soapClient;
    this.openFeignClient = openFeignClient;
  }

  @Override
  @CircuitBreaker(name = "soapProtocolloBari", fallbackMethod = "fallbackByCircuitBreakingGetProtocollo")
  @Retry(name = "soapProtocolloBari", fallbackMethod = "fallbackByRetryGetProtocollo")
  public GetProtocolloWebResponse getProtocollo(String protocolNumber, String year) {
    GetProtocollo getProtocolloSoapRequest = new GetProtocollo();
    GetProtocollo.ProtocolloInformazioniRequest getProtocolloRequestContent = new GetProtocollo.ProtocolloInformazioniRequest();
    getProtocolloRequestContent.setNumeroProtocollo(Integer.parseInt(protocolNumber));
    getProtocolloRequestContent.setAnno(year);
    getProtocolloSoapRequest.setProtocolloInformazioniRequest(getProtocolloRequestContent);

    GetProtocolloResponse soapRequest = soapClient.doSyncRequest(getProtocolloSoapRequest);

    GetProtocolloWebResponse getProtocolloWebResponse = new GetProtocolloWebResponse();
    getProtocolloWebResponse.setReturn(soapRequest.getReturn());

    return getProtocolloWebResponse;
  }

  @Override
  @CircuitBreaker(name = "soapProtocolloBari", fallbackMethod = "fallbackByCircuitBreakingRichiestaProtocolloEntrata")
  @Retry(name = "soapProtocolloBari", fallbackMethod = "fallbackByRetryRichiestaProtocolloEntrata")
  public ProtocolloEntrataWebResponse richiestaProtocolloEntrata(ProtocolloEntrataWebRequest protocolloEntrataRequest) {
    RichiestaProtocollo richiestaProtocollo = new RichiestaProtocollo();
    richiestaProtocollo.setProtocolloRequest(protocolloEntrataRequest.getProtocolloRequest());
    RichiestaProtocolloResponse soapRequest = soapClient.doSyncRequest(richiestaProtocollo);

    ProtocolloEntrataWebResponse protocolloEntrataWebResponse = new ProtocolloEntrataWebResponse();
    protocolloEntrataWebResponse.setReturn(soapRequest.getReturn());

    return protocolloEntrataWebResponse;
  }

  private Mittente getMittente(ProtocolloRequestDTO protocolloEntrataRequest){

    Mittente mittente=new Mittente();

    if(protocolloEntrataRequest.getAnagrafica().getTipologia_persona()!=null && TIPOLOGIA_PERSONA_GIURIDICA.equals(protocolloEntrataRequest.getAnagrafica().getTipologia_persona())){

      PersonaGiuridica personaGiuridica=new PersonaGiuridica();
      personaGiuridica.setRagioneSociale(protocolloEntrataRequest.getAnagrafica().getRagione_sociale());
      personaGiuridica.setPartitaIVA(protocolloEntrataRequest.getAnagrafica().getCodice_fiscale_piva());

      mittente.setPersonaGiuridica(personaGiuridica);
    }else{
      PersonaFisica personaFisica=new PersonaFisica();
      personaFisica.setNome(protocolloEntrataRequest.getAnagrafica().getNome());
      personaFisica.setCognome(protocolloEntrataRequest.getAnagrafica().getCognome());
      personaFisica.setCodiceFiscale(protocolloEntrataRequest.getAnagrafica().getCodice_fiscale());

      mittente.setPersonaFisica(personaFisica);
    }

    return mittente;
  }

  private List<ContattoDestinatario> getDestinatari(ProtocolloRequestDTO protocolloUscitaRequest) {
    List<ContattoDestinatario> destinatari=new ArrayList<ContattoDestinatario>();

    if(protocolloUscitaRequest.getComunicazioneCittadino()){
      if(protocolloUscitaRequest.getAnagrafica()==null){//Caso di inserimento regolarizzazione

          ContattoDestinatario contattoDestinatario=new ContattoDestinatario();
          contattoDestinatario.setCognome(protocolloUscitaRequest.getAnagrafica().getCognome());
          contattoDestinatario.setNome(protocolloUscitaRequest.getAnagrafica().getNome());

          destinatari.add(contattoDestinatario);

      }else{
        if(protocolloUscitaRequest.getAnagrafica().getTipologia_persona()!=null && "G".equals(protocolloUscitaRequest.getAnagrafica().getTipologia_persona())){
          ContattoDestinatario contattoDestinatario=new ContattoDestinatario();
          contattoDestinatario.setRagioneSociale(protocolloUscitaRequest.getAnagrafica().getRagione_sociale());
          contattoDestinatario.setPiva(protocolloUscitaRequest.getAnagrafica().getCodice_fiscale_piva());

          destinatari.add(contattoDestinatario);

        }else{
          ContattoDestinatario contattoDestinatario=new ContattoDestinatario();
          contattoDestinatario.setCognome(protocolloUscitaRequest.getAnagrafica().getCognome());
          contattoDestinatario.setNome(protocolloUscitaRequest.getAnagrafica().getNome());
          contattoDestinatario.setCodiceFiscale(protocolloUscitaRequest.getAnagrafica().getCodice_fiscale());

          destinatari.add(contattoDestinatario);
        }
      }
    }

    if(protocolloUscitaRequest.getDestinatari()!=null&&protocolloUscitaRequest.getDestinatari().size()>0){
      log.debug("################################ Recupero lista RagioneSocialeDestinatari feign");
      List<RagioneSocialeDestinatariDTO> resp=openFeignClient.getRagioneSocialeDestinatari(protocolloUscitaRequest.getDestinatari());

      //rimozione comunicazioni interne al municipio
      if(destinatari.size()>0||protocolloUscitaRequest.getDestinatari().size()>1){

        RagioneSocialeDestinatariDTO concessionario = resp.stream()
                .filter(customer -> customer.getGroup_id().equals("13"))
                .findAny()
                .orElse(null);

        if(concessionario!=null){
          ContattoDestinatario contattoDestinatario=new ContattoDestinatario();
          contattoDestinatario.setRagioneSociale(concessionario.getRagioneSociale());
          contattoDestinatario.setPiva(concessionario.getCodicefiscale());

          destinatari.add(contattoDestinatario);
        }

        resp=resp.stream().filter(el -> !el.getGroup_id().equals("13")).collect(Collectors.toList());

        final AtomicInteger uoid=new AtomicInteger();

        if(protocolloUscitaRequest.getUoid()==null||protocolloUscitaRequest.equals("")){
          log.debug("################################ Recupero UOID feign");
          UoidDTO uoidDTO=openFeignClient.getUOID("municipio_"+protocolloUscitaRequest.getDati_istanza().getIndirizzo_segnale_indicatore().getMunicipio_id());

          uoid.set(Integer.valueOf(uoidDTO.getUoid()));
        }else{
          uoid.set(Integer.valueOf(protocolloUscitaRequest.getUoid()));
        }

        if(uoid.get()!=0){
          resp=resp.stream().filter(el -> el.getUoid()!= null && !el.getUoid().equals(
                  uoid.get()
          )).collect(Collectors.toList());
        }

      }

      if(resp.size()>0){

        resp = resp.stream()
                .filter( distinctByKey(p -> p.getDenominazione()) )
                .collect( Collectors.toList() );

        resp.forEach(r->{
          ContattoDestinatario contattoDestinatario=new ContattoDestinatario();
          contattoDestinatario.setRagioneSociale(r.getDenominazione());

          destinatari.add(contattoDestinatario);
        });
      }
    }

    return destinatari;
  }

  private <T> Predicate<T> distinctByKey(Function<? super T, Object> keyExtractor){
    Map<Object, Boolean> map = new ConcurrentHashMap<>();
    return t -> map.putIfAbsent(keyExtractor.apply(t), Boolean.TRUE) == null;
  }

  private String getOggetto(ProtocolloRequestDTO protocolloUscitaRequest){
    String oggetto=null;

    if(protocolloUscitaRequest.getAnagrafica()==null){
      oggetto=String.format("Concessione di Passo Carrabile - Regolarizzazione - %s - %s %s", protocolloUscitaRequest.getDati_istanza().getIndirizzo_segnale_indicatore().getIndirizzo(),protocolloUscitaRequest.getNome(), protocolloUscitaRequest.getCognome());
    }else{
      if(protocolloUscitaRequest.getAnagrafica().getTipologia_persona()!=null && "G".equals(protocolloUscitaRequest.getAnagrafica().getTipologia_persona())){
        oggetto=String.format("Concessione di Passo Carrabile - %s - %s - %s", protocolloUscitaRequest.getTipologia_pratica(),protocolloUscitaRequest.getDati_istanza().getIndirizzo_segnale_indicatore().getIndirizzo(),protocolloUscitaRequest.getAnagrafica().getRagione_sociale());
      }else{
        oggetto=String.format("Concessione di Passo Carrabile - %s - %s - %s %s", protocolloUscitaRequest.getTipologia_pratica(),protocolloUscitaRequest.getDati_istanza().getIndirizzo_segnale_indicatore().getIndirizzo(),protocolloUscitaRequest.getAnagrafica().getNome(), protocolloUscitaRequest.getAnagrafica().getCognome());
      }
    }

    return oggetto;
  }

  @Override
  @CircuitBreaker(name = "soapProtocolloBariGPC", fallbackMethod = "fallbackByCircuitBreakingRichiestaProtocolloUscitaGPC")
  @Retry(name = "soapProtocolloBariGPC", fallbackMethod = "fallbackByRetryRichiestaProtocolloUscitaGPC")
  public ProtocolloUscitaWebResponse richiestaProtocolloUscita(ProtocolloRequestDTO protocolloUscitaRequest, String base64, String estensioneBase64, List<MultipartFile> allegati) throws ProtocolloException{
    RichiestaProtocolloUscita.ProtocolloUscitaRequest protReq=new RichiestaProtocolloUscita.ProtocolloUscitaRequest();

    protReq.setDestinatari(getDestinatari(protocolloUscitaRequest));

    protReq.setDocumento(getDocumento(protocolloUscitaRequest, base64, estensioneBase64));

    protReq.setAreaOrganizzativaOmogenea(codiceAmministrazione);
    protReq.setAmministrazione(codiceAmministrazione);
    protReq.setOggetto(getOggetto(protocolloUscitaRequest));

    if(protocolloUscitaRequest.getUoid()==null||protocolloUscitaRequest.equals("")){
      log.debug("################################ Recupero UOID feign");
      UoidDTO uoidDTO=openFeignClient.getUOID("municipio_"+protocolloUscitaRequest.getDati_istanza().getIndirizzo_segnale_indicatore().getMunicipio_id());

      if(uoidDTO!=null){
        protReq.setIdUtente(Integer.valueOf(uoidDTO.getUoid()));
      }

    }else{
      protReq.setIdUtente(Integer.valueOf(protocolloUscitaRequest.getUoid()));
    }

    RichiestaProtocolloUscita richiestaProtocolloUscita = new RichiestaProtocolloUscita();
    richiestaProtocolloUscita.setProtocolloUscitaRequest(protReq);

    richiestaProtocolloUscita.getProtocolloUscitaRequest().setAllegati(protocolloUtil.buildAllegati(allegati,false, true));

    RichiestaProtocolloUscitaResponse soapResponse = soapClient.doSyncRequest(richiestaProtocolloUscita);

    if(soapResponse.getReturn()!=null&&soapResponse.getReturn().getErrore()!=null){
      throw new ProtocolloException(soapResponse.getReturn().getErrore().getDescrizione());
    }

    ProtocolloUscitaWebResponse protocolloUscitaWebResponse = new ProtocolloUscitaWebResponse();
    protocolloUscitaWebResponse.setReturn(soapResponse.getReturn());

    return protocolloUscitaWebResponse;
  }

  @Override
  @CircuitBreaker(name = "soapProtocolloBariGPC", fallbackMethod = "fallbackByCircuitBreakingRichiestaProtocolloEntrataGPC")
  @Retry(name = "soapProtocolloBariGPC", fallbackMethod = "fallbackByRetryRichiestaProtocolloEntrataGPC")
  public ProtocolloEntrataWebResponse richiestaProtocolloEntrata(ProtocolloRequestDTO protocolloEntrataRequest, String base64, String estensioneBase64, List<MultipartFile> allegati) throws ProtocolloException {
    RichiestaProtocollo.ProtocolloRequest protReq=new RichiestaProtocollo.ProtocolloRequest();
    protReq.setMittente(getMittente(protocolloEntrataRequest));

    protReq.setDocumento(getDocumento(protocolloEntrataRequest, base64, estensioneBase64));

    protReq.setAreaOrganizzativaOmogenea(codiceAmministrazione);
    protReq.setAmministrazione(codiceAmministrazione);

    protReq.setOggetto(getOggetto(protocolloEntrataRequest));

    if(protocolloEntrataRequest.getUoid()==null||protocolloEntrataRequest.getUoid().equals("")){

      log.debug("################################ Recupero UOID feign");

      UoidDTO uoidDTO = openFeignClient.getUOID("municipio_" + protocolloEntrataRequest.getDati_istanza().getIndirizzo_segnale_indicatore().getMunicipio_id());

      if(uoidDTO!=null){
        protReq.setIdUtente(Integer.valueOf(uoidDTO.getUoid()));
      }

    }else{
      protReq.setIdUtente(Integer.valueOf(protocolloEntrataRequest.getUoid()));
    }

    RichiestaProtocollo richiestaProtocollo = new RichiestaProtocollo();
    richiestaProtocollo.setProtocolloRequest(protReq);

    richiestaProtocollo.getProtocolloRequest().setAllegati(protocolloUtil.buildAllegati(allegati,false, true));

    log.debug("################################ doSyncRequest");
    RichiestaProtocolloResponse soapRequest = soapClient.doSyncRequest(richiestaProtocollo);

    if(soapRequest.getReturn()!=null&&soapRequest.getReturn().getErrore()!=null){
      throw new ProtocolloException(soapRequest.getReturn().getErrore().getDescrizione());
    }

    ProtocolloEntrataWebResponse protocolloEntrataWebResponse = new ProtocolloEntrataWebResponse();
    protocolloEntrataWebResponse.setReturn(soapRequest.getReturn());

    return protocolloEntrataWebResponse;
  }

  private Documento getDocumento(ProtocolloRequestDTO protocolloRequest, String base64, String estensioneBase64) {
    Documento documento=null;

    if(base64!=null&&!base64.isEmpty()) {
      String tipologiaPratica = protocolloRequest.getTipologia_pratica();

      if (tipologiaPratica == null || tipologiaPratica.isEmpty()) {
        tipologiaPratica = "N.D.";
      } else {
        tipologiaPratica = String.valueOf(tipologiaPratica.charAt(0)).toUpperCase() + (tipologiaPratica.length() > 1 ? String.valueOf(tipologiaPratica.substring(1)) : "");
      }

      String nomeFile = tipologiaPratica;

      if(protocolloRequest.getAnagrafica()!=null){//protocollo entrata
        if (protocolloRequest.getAnagrafica().getTipologia_persona() != null && "G".equals(protocolloRequest.getAnagrafica().getTipologia_persona())) {
          nomeFile += " " + protocolloRequest.getAnagrafica().getRagione_sociale();
        } else {
          nomeFile += " " + protocolloRequest.getAnagrafica().getNome() + " " + protocolloRequest.getAnagrafica().getCognome();
        }
      }else{
        nomeFile += " " + protocolloRequest.getNome() + " " + protocolloRequest.getCognome();
      }

      nomeFile += " " + System.currentTimeMillis() + estensioneBase64;

      documento = new Documento();
      documento.setNomeFile(nomeFile);

      byte[] decoder = null;

      try {
        decoder = Base64.getDecoder().decode(base64);
      }catch(IllegalArgumentException t){
        throw new ProtocolloException("Errore in fase di decodifica documento principale");
      }

      documento.setContenuto(decoder);
    }

    return documento;
  }

  @Override
  @CircuitBreaker(name = "soapProtocolloBari", fallbackMethod = "fallbackByCircuitBreakingRichiestaProtocolloUscita")
  @Retry(name = "soapProtocolloBari", fallbackMethod = "fallbackByRetryRichiestaProtocolloUscita")
  public ProtocolloUscitaWebResponse richiestaProtocolloUscita(ProtocolloUscitaWebRequest protocolloUscitaWebRequest) {
    RichiestaProtocolloUscita richiestaProtocolloUscita = new RichiestaProtocolloUscita();
    richiestaProtocolloUscita.setProtocolloUscitaRequest(protocolloUscitaWebRequest.getProtocolloUscitaRequest());
    RichiestaProtocolloUscitaResponse soapResponse = soapClient.doSyncRequest(richiestaProtocolloUscita);

    ProtocolloUscitaWebResponse protocolloUscitaWebResponse = new ProtocolloUscitaWebResponse();
    protocolloUscitaWebResponse.setReturn(soapResponse.getReturn());

    return protocolloUscitaWebResponse;
  }

  @SuppressWarnings("unused")
  private GetProtocolloWebResponse fallbackByCircuitBreakingGetProtocollo(String protocolNumber, String year, Exception e) {
    e.printStackTrace();

    log.warn("Fallback by circuit breaking Get Protocollo");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di recupero protocollo: " + e.getMessage());
    }
  }

  @SuppressWarnings("unused")
  private GetProtocolloWebResponse fallbackByRetryGetProtocollo(String protocolNumber, String year, Exception e) {
    e.printStackTrace();

    log.warn("Fallback by retry Get Protocollo");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di recupero protocollo: "+e.getMessage());
    }
  }

  @SuppressWarnings("unused")
  private ProtocolloEntrataWebResponse fallbackByCircuitBreakingRichiestaProtocolloEntrata(ProtocolloEntrataWebRequest protocolloEntrataRequest, Exception e) {
    e.printStackTrace();

    log.warn("Fallback by circuit breaking Richiesta Protocollo Entrata");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di Richiesta Protocollo Entrata: "+e.getMessage());
    }
  }

  @SuppressWarnings("unused")
  private ProtocolloEntrataWebResponse fallbackByRetryRichiestaProtocolloEntrata(ProtocolloEntrataWebRequest protocolloEntrataRequest, Exception e) {
    e.printStackTrace();
    log.warn("Fallback by retry Richiesta Protocollo Entrata");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di Richiesta Protocollo Entrata: "+e.getMessage());
    }

  }

  @SuppressWarnings("unused")
  private ProtocolloUscitaWebResponse fallbackByCircuitBreakingRichiestaProtocolloUscita(ProtocolloUscitaWebRequest protocolloUscitaWebRequest, Exception e) {
    e.printStackTrace();

    log.warn("Fallback by circuit breaking Richiesta Protocollo Uscita");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di Richiesta Protocollo Uscita: "+e.getMessage());
    }
  }

  @SuppressWarnings("unused")
  private ProtocolloUscitaWebResponse fallbackByRetryRichiestaProtocolloUscita(ProtocolloUscitaWebRequest protocolloUscitaWebRequest, Exception e) {
    e.printStackTrace();

    log.warn("Fallback by retry Richiesta Protocollo Uscita");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di Richiesta Protocollo Uscita: "+e.getMessage());
    }

  }

  @SuppressWarnings("unused")
  private ProtocolloEntrataWebResponse fallbackByCircuitBreakingRichiestaProtocolloEntrataGPC(ProtocolloRequestDTO protocolloEntrataRequest, String base64, String estensioneBase64, List<MultipartFile> allegati, Exception e) {
    e.printStackTrace();

    log.warn("Fallback by circuit breaking Richiesta Protocollo Entrata");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di Richiesta Protocollo Entrata: "+e.getMessage());
    }
  }

  @SuppressWarnings("unused")
  private ProtocolloEntrataWebResponse fallbackByRetryRichiestaProtocolloEntrataGPC(ProtocolloRequestDTO protocolloEntrataRequest, String base64, String estensioneBase64, List<MultipartFile> allegati, Exception e) {
    e.printStackTrace();

    log.warn("Fallback by retry Richiesta Protocollo Entrata");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di Richiesta Protocollo Entrata: "+e.getMessage());
    }
  }

  @SuppressWarnings("unused")
  private ProtocolloUscitaWebResponse fallbackByCircuitBreakingRichiestaProtocolloUscitaGPC(ProtocolloRequestDTO protocolloUscitaRequest, String base64, String estensioneBase64, List<MultipartFile> allegati, Exception e) {
    e.printStackTrace();

    log.warn("Fallback by circuit breaking Richiesta Protocollo Uscita");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di Richiesta Protocollo Uscita: "+e.getMessage());
    }
  }

  @SuppressWarnings("unused")
  private ProtocolloUscitaWebResponse fallbackByRetryRichiestaProtocolloUscitaGPC(ProtocolloRequestDTO protocolloUscitaRequest, String base64, String estensioneBase64, List<MultipartFile> allegati, Exception e) {
    e.printStackTrace();

    log.warn("Fallback by retry Richiesta Protocollo Uscita");

    if(e instanceof ProtocolloException){
      throw (ProtocolloException)e;
    }else {
      throw new ProtocolloException("Errore in fase di Richiesta Protocollo Uscita: "+e.getMessage());
    }
  }

}
