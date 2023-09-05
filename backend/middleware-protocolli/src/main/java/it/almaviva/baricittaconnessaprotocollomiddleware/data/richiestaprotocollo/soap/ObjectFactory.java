
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap;

import javax.xml.bind.JAXBElement;
import javax.xml.bind.annotation.XmlElementDecl;
import javax.xml.bind.annotation.XmlRegistry;
import javax.xml.namespace.QName;


/**
 * This object contains factory methods for each 
 * Java content interface and Java element interface 
 * generated in the it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap package. 
 * <p>An ObjectFactory allows you to programatically 
 * construct new instances of the Java representation 
 * for XML content. The Java representation of XML 
 * content can consist of schema derived interfaces 
 * and classes representing the binding of schema 
 * type definitions, element declarations and model 
 * groups.  Factory methods for each of these are 
 * provided in this class.
 * 
 */
@XmlRegistry
public class ObjectFactory {

    private final static QName _AddAllegatura_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "addAllegatura");
    private final static QName _AddAllegaturaResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "addAllegaturaResponse");
    private final static QName _CompletamentoProtocolloProvvisorio_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "completamentoProtocolloProvvisorio");
    private final static QName _CompletamentoProtocolloProvvisorioResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "completamentoProtocolloProvvisorioResponse");
    private final static QName _GetAllegato_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "getAllegato");
    private final static QName _GetAllegatoResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "getAllegatoResponse");
    private final static QName _GetDestinatariProtocollo_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "getDestinatariProtocollo");
    private final static QName _GetDestinatariProtocolloResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "getDestinatariProtocolloResponse");
    private final static QName _GetMittenteProtocollo_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "getMittenteProtocollo");
    private final static QName _GetMittenteProtocolloResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "getMittenteProtocolloResponse");
    private final static QName _GetProtocollo_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "getProtocollo");
    private final static QName _GetProtocolloResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "getProtocolloResponse");
    private final static QName _InoltraProtocollo_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "inoltraProtocollo");
    private final static QName _InoltraProtocolloResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "inoltraProtocolloResponse");
    private final static QName _RichiestaProtocollo_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocollo");
    private final static QName _RichiestaProtocolloFasc_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocolloFasc");
    private final static QName _RichiestaProtocolloFascResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocolloFascResponse");
    private final static QName _RichiestaProtocolloProvvisorio_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocolloProvvisorio");
    private final static QName _RichiestaProtocolloProvvisorioResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocolloProvvisorioResponse");
    private final static QName _RichiestaProtocolloResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocolloResponse");
    private final static QName _RichiestaProtocolloUscita_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocolloUscita");
    private final static QName _RichiestaProtocolloUscitaFasc_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocolloUscitaFasc");
    private final static QName _RichiestaProtocolloUscitaFascResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocolloUscitaFascResponse");
    private final static QName _RichiestaProtocolloUscitaResponse_QNAME = new QName("http://server.ws.protocollo.linksmt.it/", "richiestaProtocolloUscitaResponse");

    /**
     * Create a new ObjectFactory that can be used to create new instances of schema derived classes for package: it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap
     * 
     */
    public ObjectFactory() {
    }

    /**
     * Create an instance of {@link RichiestaProtocolloUscitaResponse }
     * 
     */
    public RichiestaProtocolloUscitaResponse createRichiestaProtocolloUscitaResponse() {
        return new RichiestaProtocolloUscitaResponse();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloUscitaFascResponse }
     * 
     */
    public RichiestaProtocolloUscitaFascResponse createRichiestaProtocolloUscitaFascResponse() {
        return new RichiestaProtocolloUscitaFascResponse();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloUscitaFasc }
     * 
     */
    public RichiestaProtocolloUscitaFasc createRichiestaProtocolloUscitaFasc() {
        return new RichiestaProtocolloUscitaFasc();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloUscita }
     * 
     */
    public RichiestaProtocolloUscita createRichiestaProtocolloUscita() {
        return new RichiestaProtocolloUscita();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloResponse }
     * 
     */
    public RichiestaProtocolloResponse createRichiestaProtocolloResponse() {
        return new RichiestaProtocolloResponse();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloProvvisorioResponse }
     * 
     */
    public RichiestaProtocolloProvvisorioResponse createRichiestaProtocolloProvvisorioResponse() {
        return new RichiestaProtocolloProvvisorioResponse();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloProvvisorio }
     * 
     */
    public RichiestaProtocolloProvvisorio createRichiestaProtocolloProvvisorio() {
        return new RichiestaProtocolloProvvisorio();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloFascResponse }
     * 
     */
    public RichiestaProtocolloFascResponse createRichiestaProtocolloFascResponse() {
        return new RichiestaProtocolloFascResponse();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloFasc }
     * 
     */
    public RichiestaProtocolloFasc createRichiestaProtocolloFasc() {
        return new RichiestaProtocolloFasc();
    }

    /**
     * Create an instance of {@link RichiestaProtocollo }
     * 
     */
    public RichiestaProtocollo createRichiestaProtocollo() {
        return new RichiestaProtocollo();
    }

    /**
     * Create an instance of {@link InoltraProtocolloResponse }
     * 
     */
    public InoltraProtocolloResponse createInoltraProtocolloResponse() {
        return new InoltraProtocolloResponse();
    }

    /**
     * Create an instance of {@link InoltraProtocollo }
     * 
     */
    public InoltraProtocollo createInoltraProtocollo() {
        return new InoltraProtocollo();
    }

    /**
     * Create an instance of {@link GetProtocolloResponse }
     * 
     */
    public GetProtocolloResponse createGetProtocolloResponse() {
        return new GetProtocolloResponse();
    }

    /**
     * Create an instance of {@link GetProtocollo }
     * 
     */
    public GetProtocollo createGetProtocollo() {
        return new GetProtocollo();
    }

    /**
     * Create an instance of {@link GetMittenteProtocolloResponse }
     * 
     */
    public GetMittenteProtocolloResponse createGetMittenteProtocolloResponse() {
        return new GetMittenteProtocolloResponse();
    }

    /**
     * Create an instance of {@link GetMittenteProtocollo }
     * 
     */
    public GetMittenteProtocollo createGetMittenteProtocollo() {
        return new GetMittenteProtocollo();
    }

    /**
     * Create an instance of {@link GetDestinatariProtocolloResponse }
     * 
     */
    public GetDestinatariProtocolloResponse createGetDestinatariProtocolloResponse() {
        return new GetDestinatariProtocolloResponse();
    }

    /**
     * Create an instance of {@link GetDestinatariProtocollo }
     * 
     */
    public GetDestinatariProtocollo createGetDestinatariProtocollo() {
        return new GetDestinatariProtocollo();
    }

    /**
     * Create an instance of {@link GetAllegatoResponse }
     * 
     */
    public GetAllegatoResponse createGetAllegatoResponse() {
        return new GetAllegatoResponse();
    }

    /**
     * Create an instance of {@link GetAllegato }
     * 
     */
    public GetAllegato createGetAllegato() {
        return new GetAllegato();
    }

    /**
     * Create an instance of {@link CompletamentoProtocolloProvvisorioResponse }
     * 
     */
    public CompletamentoProtocolloProvvisorioResponse createCompletamentoProtocolloProvvisorioResponse() {
        return new CompletamentoProtocolloProvvisorioResponse();
    }

    /**
     * Create an instance of {@link CompletamentoProtocolloProvvisorio }
     * 
     */
    public CompletamentoProtocolloProvvisorio createCompletamentoProtocolloProvvisorio() {
        return new CompletamentoProtocolloProvvisorio();
    }

    /**
     * Create an instance of {@link AddAllegaturaResponse }
     * 
     */
    public AddAllegaturaResponse createAddAllegaturaResponse() {
        return new AddAllegaturaResponse();
    }

    /**
     * Create an instance of {@link AddAllegatura }
     * 
     */
    public AddAllegatura createAddAllegatura() {
        return new AddAllegatura();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.AllegaturaRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.AllegaturaRequest createAllegaturaRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.AllegaturaRequest();
    }

    /**
     * Create an instance of {@link Allegato }
     * 
     */
    public Allegato createAllegato() {
        return new Allegato();
    }

    /**
     * Create an instance of {@link AllegaturaResponse }
     * 
     */
    public AllegaturaResponse createAllegaturaResponse() {
        return new AllegaturaResponse();
    }

    /**
     * Create an instance of {@link Errore }
     * 
     */
    public Errore createErrore() {
        return new Errore();
    }

    /**
     * Create an instance of {@link DestinatariProtocolloRequest }
     * 
     */
    public DestinatariProtocolloRequest createDestinatariProtocolloRequest() {
        return new DestinatariProtocolloRequest();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.DettaglioAllegatoRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.DettaglioAllegatoRequest createDettaglioAllegatoRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.DettaglioAllegatoRequest();
    }

    /**
     * Create an instance of {@link DettaglioAllegatoResponse }
     * 
     */
    public DettaglioAllegatoResponse createDettaglioAllegatoResponse() {
        return new DettaglioAllegatoResponse();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.InoltroProtocolloRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.InoltroProtocolloRequest createInoltroProtocolloRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.InoltroProtocolloRequest();
    }

    /**
     * Create an instance of {@link InoltroProtocolloResponse }
     * 
     */
    public InoltroProtocolloResponse createInoltroProtocolloResponse() {
        return new InoltroProtocolloResponse();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.MittenteProtocolloRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.MittenteProtocolloRequest createMittenteProtocolloRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.MittenteProtocolloRequest();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloDaCompletareRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloDaCompletareRequest createProtocolloDaCompletareRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloDaCompletareRequest();
    }

    /**
     * Create an instance of {@link Documento }
     * 
     */
    public Documento createDocumento() {
        return new Documento();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloFascRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloFascRequest createProtocolloFascRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloFascRequest();
    }

    /**
     * Create an instance of {@link Mittente }
     * 
     */
    public Mittente createMittente() {
        return new Mittente();
    }

    /**
     * Create an instance of {@link Destinatario }
     * 
     */
    public Destinatario createDestinatario() {
        return new Destinatario();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloInformazioniRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloInformazioniRequest createProtocolloInformazioniRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloInformazioniRequest();
    }

    /**
     * Create an instance of {@link ProtocolloInformazioniResponse }
     * 
     */
    public ProtocolloInformazioniResponse createProtocolloInformazioniResponse() {
        return new ProtocolloInformazioniResponse();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloProvvisorioRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloProvvisorioRequest createProtocolloProvvisorioRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloProvvisorioRequest();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloRequest createProtocolloRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloRequest();
    }

    /**
     * Create an instance of {@link ProtocolloResponse }
     * 
     */
    public ProtocolloResponse createProtocolloResponse() {
        return new ProtocolloResponse();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloUscitaFascRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloUscitaFascRequest createProtocolloUscitaFascRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloUscitaFascRequest();
    }

    /**
     * Create an instance of {@link MittenteProtUscita }
     * 
     */
    public MittenteProtUscita createMittenteProtUscita() {
        return new MittenteProtUscita();
    }

    /**
     * Create an instance of {@link ContattoDestinatario }
     * 
     */
    public ContattoDestinatario createContattoDestinatario() {
        return new ContattoDestinatario();
    }

    /**
     * Create an instance of {@link DatiEmail }
     * 
     */
    public DatiEmail createDatiEmail() {
        return new DatiEmail();
    }

    /**
     * Create an instance of {@link ProtocolloUscitaFascResponse }
     * 
     */
    public ProtocolloUscitaFascResponse createProtocolloUscitaFascResponse() {
        return new ProtocolloUscitaFascResponse();
    }

    /**
     * Create an instance of {@link it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloUscitaRequest }
     * 
     */
    public it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloUscitaRequest createProtocolloUscitaRequest() {
        return new it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap.ProtocolloUscitaRequest();
    }

    /**
     * Create an instance of {@link ProtocolloUscitaResponse }
     * 
     */
    public ProtocolloUscitaResponse createProtocolloUscitaResponse() {
        return new ProtocolloUscitaResponse();
    }

    /**
     * Create an instance of {@link PersonaFisica }
     * 
     */
    public PersonaFisica createPersonaFisica() {
        return new PersonaFisica();
    }

    /**
     * Create an instance of {@link PersonaGiuridica }
     * 
     */
    public PersonaGiuridica createPersonaGiuridica() {
        return new PersonaGiuridica();
    }

    /**
     * Create an instance of {@link ImprontaMIME }
     * 
     */
    public ImprontaMIME createImprontaMIME() {
        return new ImprontaMIME();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloUscitaResponse.Return }
     * 
     */
    public RichiestaProtocolloUscitaResponse.Return createRichiestaProtocolloUscitaResponseReturn() {
        return new RichiestaProtocolloUscitaResponse.Return();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloUscitaFascResponse.Return }
     * 
     */
    public RichiestaProtocolloUscitaFascResponse.Return createRichiestaProtocolloUscitaFascResponseReturn() {
        return new RichiestaProtocolloUscitaFascResponse.Return();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloUscitaFasc.ProtocolloUscitaFascRequest }
     * 
     */
    public RichiestaProtocolloUscitaFasc.ProtocolloUscitaFascRequest createRichiestaProtocolloUscitaFascProtocolloUscitaFascRequest() {
        return new RichiestaProtocolloUscitaFasc.ProtocolloUscitaFascRequest();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloUscita.ProtocolloUscitaRequest }
     * 
     */
    public RichiestaProtocolloUscita.ProtocolloUscitaRequest createRichiestaProtocolloUscitaProtocolloUscitaRequest() {
        return new RichiestaProtocolloUscita.ProtocolloUscitaRequest();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloResponse.Return }
     * 
     */
    public RichiestaProtocolloResponse.Return createRichiestaProtocolloResponseReturn() {
        return new RichiestaProtocolloResponse.Return();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloProvvisorioResponse.Return }
     * 
     */
    public RichiestaProtocolloProvvisorioResponse.Return createRichiestaProtocolloProvvisorioResponseReturn() {
        return new RichiestaProtocolloProvvisorioResponse.Return();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloProvvisorio.ProtocolloProvvisorioRequest }
     * 
     */
    public RichiestaProtocolloProvvisorio.ProtocolloProvvisorioRequest createRichiestaProtocolloProvvisorioProtocolloProvvisorioRequest() {
        return new RichiestaProtocolloProvvisorio.ProtocolloProvvisorioRequest();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloFascResponse.Return }
     * 
     */
    public RichiestaProtocolloFascResponse.Return createRichiestaProtocolloFascResponseReturn() {
        return new RichiestaProtocolloFascResponse.Return();
    }

    /**
     * Create an instance of {@link RichiestaProtocolloFasc.ProtocolloFascRequest }
     * 
     */
    public RichiestaProtocolloFasc.ProtocolloFascRequest createRichiestaProtocolloFascProtocolloFascRequest() {
        return new RichiestaProtocolloFasc.ProtocolloFascRequest();
    }

    /**
     * Create an instance of {@link RichiestaProtocollo.ProtocolloRequest }
     * 
     */
    public RichiestaProtocollo.ProtocolloRequest createRichiestaProtocolloProtocolloRequest() {
        return new RichiestaProtocollo.ProtocolloRequest();
    }

    /**
     * Create an instance of {@link InoltraProtocolloResponse.Return }
     * 
     */
    public InoltraProtocolloResponse.Return createInoltraProtocolloResponseReturn() {
        return new InoltraProtocolloResponse.Return();
    }

    /**
     * Create an instance of {@link InoltraProtocollo.InoltroProtocolloRequest }
     * 
     */
    public InoltraProtocollo.InoltroProtocolloRequest createInoltraProtocolloInoltroProtocolloRequest() {
        return new InoltraProtocollo.InoltroProtocolloRequest();
    }

    /**
     * Create an instance of {@link GetProtocolloResponse.Return }
     * 
     */
    public GetProtocolloResponse.Return createGetProtocolloResponseReturn() {
        return new GetProtocolloResponse.Return();
    }

    /**
     * Create an instance of {@link GetProtocollo.ProtocolloInformazioniRequest }
     * 
     */
    public GetProtocollo.ProtocolloInformazioniRequest createGetProtocolloProtocolloInformazioniRequest() {
        return new GetProtocollo.ProtocolloInformazioniRequest();
    }

    /**
     * Create an instance of {@link GetMittenteProtocolloResponse.Return }
     * 
     */
    public GetMittenteProtocolloResponse.Return createGetMittenteProtocolloResponseReturn() {
        return new GetMittenteProtocolloResponse.Return();
    }

    /**
     * Create an instance of {@link GetMittenteProtocollo.MittenteProtocolloRequest }
     * 
     */
    public GetMittenteProtocollo.MittenteProtocolloRequest createGetMittenteProtocolloMittenteProtocolloRequest() {
        return new GetMittenteProtocollo.MittenteProtocolloRequest();
    }

    /**
     * Create an instance of {@link GetDestinatariProtocolloResponse.Return }
     * 
     */
    public GetDestinatariProtocolloResponse.Return createGetDestinatariProtocolloResponseReturn() {
        return new GetDestinatariProtocolloResponse.Return();
    }

    /**
     * Create an instance of {@link GetDestinatariProtocollo.DestinatarioProtocolloRequest }
     * 
     */
    public GetDestinatariProtocollo.DestinatarioProtocolloRequest createGetDestinatariProtocolloDestinatarioProtocolloRequest() {
        return new GetDestinatariProtocollo.DestinatarioProtocolloRequest();
    }

    /**
     * Create an instance of {@link GetAllegatoResponse.Return }
     * 
     */
    public GetAllegatoResponse.Return createGetAllegatoResponseReturn() {
        return new GetAllegatoResponse.Return();
    }

    /**
     * Create an instance of {@link GetAllegato.DettaglioAllegatoRequest }
     * 
     */
    public GetAllegato.DettaglioAllegatoRequest createGetAllegatoDettaglioAllegatoRequest() {
        return new GetAllegato.DettaglioAllegatoRequest();
    }

    /**
     * Create an instance of {@link CompletamentoProtocolloProvvisorioResponse.Return }
     * 
     */
    public CompletamentoProtocolloProvvisorioResponse.Return createCompletamentoProtocolloProvvisorioResponseReturn() {
        return new CompletamentoProtocolloProvvisorioResponse.Return();
    }

    /**
     * Create an instance of {@link CompletamentoProtocolloProvvisorio.ProtocolloDaCompletareRequest }
     * 
     */
    public CompletamentoProtocolloProvvisorio.ProtocolloDaCompletareRequest createCompletamentoProtocolloProvvisorioProtocolloDaCompletareRequest() {
        return new CompletamentoProtocolloProvvisorio.ProtocolloDaCompletareRequest();
    }

    /**
     * Create an instance of {@link AddAllegaturaResponse.Return }
     * 
     */
    public AddAllegaturaResponse.Return createAddAllegaturaResponseReturn() {
        return new AddAllegaturaResponse.Return();
    }

    /**
     * Create an instance of {@link AddAllegatura.AllegaturaRequest }
     * 
     */
    public AddAllegatura.AllegaturaRequest createAddAllegaturaAllegaturaRequest() {
        return new AddAllegatura.AllegaturaRequest();
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link AddAllegatura }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link AddAllegatura }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "addAllegatura")
    public JAXBElement<AddAllegatura> createAddAllegatura(AddAllegatura value) {
        return new JAXBElement<AddAllegatura>(_AddAllegatura_QNAME, AddAllegatura.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link AddAllegaturaResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link AddAllegaturaResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "addAllegaturaResponse")
    public JAXBElement<AddAllegaturaResponse> createAddAllegaturaResponse(AddAllegaturaResponse value) {
        return new JAXBElement<AddAllegaturaResponse>(_AddAllegaturaResponse_QNAME, AddAllegaturaResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link CompletamentoProtocolloProvvisorio }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link CompletamentoProtocolloProvvisorio }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "completamentoProtocolloProvvisorio")
    public JAXBElement<CompletamentoProtocolloProvvisorio> createCompletamentoProtocolloProvvisorio(CompletamentoProtocolloProvvisorio value) {
        return new JAXBElement<CompletamentoProtocolloProvvisorio>(_CompletamentoProtocolloProvvisorio_QNAME, CompletamentoProtocolloProvvisorio.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link CompletamentoProtocolloProvvisorioResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link CompletamentoProtocolloProvvisorioResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "completamentoProtocolloProvvisorioResponse")
    public JAXBElement<CompletamentoProtocolloProvvisorioResponse> createCompletamentoProtocolloProvvisorioResponse(CompletamentoProtocolloProvvisorioResponse value) {
        return new JAXBElement<CompletamentoProtocolloProvvisorioResponse>(_CompletamentoProtocolloProvvisorioResponse_QNAME, CompletamentoProtocolloProvvisorioResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link GetAllegato }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link GetAllegato }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "getAllegato")
    public JAXBElement<GetAllegato> createGetAllegato(GetAllegato value) {
        return new JAXBElement<GetAllegato>(_GetAllegato_QNAME, GetAllegato.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link GetAllegatoResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link GetAllegatoResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "getAllegatoResponse")
    public JAXBElement<GetAllegatoResponse> createGetAllegatoResponse(GetAllegatoResponse value) {
        return new JAXBElement<GetAllegatoResponse>(_GetAllegatoResponse_QNAME, GetAllegatoResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link GetDestinatariProtocollo }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link GetDestinatariProtocollo }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "getDestinatariProtocollo")
    public JAXBElement<GetDestinatariProtocollo> createGetDestinatariProtocollo(GetDestinatariProtocollo value) {
        return new JAXBElement<GetDestinatariProtocollo>(_GetDestinatariProtocollo_QNAME, GetDestinatariProtocollo.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link GetDestinatariProtocolloResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link GetDestinatariProtocolloResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "getDestinatariProtocolloResponse")
    public JAXBElement<GetDestinatariProtocolloResponse> createGetDestinatariProtocolloResponse(GetDestinatariProtocolloResponse value) {
        return new JAXBElement<GetDestinatariProtocolloResponse>(_GetDestinatariProtocolloResponse_QNAME, GetDestinatariProtocolloResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link GetMittenteProtocollo }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link GetMittenteProtocollo }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "getMittenteProtocollo")
    public JAXBElement<GetMittenteProtocollo> createGetMittenteProtocollo(GetMittenteProtocollo value) {
        return new JAXBElement<GetMittenteProtocollo>(_GetMittenteProtocollo_QNAME, GetMittenteProtocollo.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link GetMittenteProtocolloResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link GetMittenteProtocolloResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "getMittenteProtocolloResponse")
    public JAXBElement<GetMittenteProtocolloResponse> createGetMittenteProtocolloResponse(GetMittenteProtocolloResponse value) {
        return new JAXBElement<GetMittenteProtocolloResponse>(_GetMittenteProtocolloResponse_QNAME, GetMittenteProtocolloResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link GetProtocollo }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link GetProtocollo }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "getProtocollo")
    public JAXBElement<GetProtocollo> createGetProtocollo(GetProtocollo value) {
        return new JAXBElement<GetProtocollo>(_GetProtocollo_QNAME, GetProtocollo.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link GetProtocolloResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link GetProtocolloResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "getProtocolloResponse")
    public JAXBElement<GetProtocolloResponse> createGetProtocolloResponse(GetProtocolloResponse value) {
        return new JAXBElement<GetProtocolloResponse>(_GetProtocolloResponse_QNAME, GetProtocolloResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link InoltraProtocollo }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link InoltraProtocollo }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "inoltraProtocollo")
    public JAXBElement<InoltraProtocollo> createInoltraProtocollo(InoltraProtocollo value) {
        return new JAXBElement<InoltraProtocollo>(_InoltraProtocollo_QNAME, InoltraProtocollo.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link InoltraProtocolloResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link InoltraProtocolloResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "inoltraProtocolloResponse")
    public JAXBElement<InoltraProtocolloResponse> createInoltraProtocolloResponse(InoltraProtocolloResponse value) {
        return new JAXBElement<InoltraProtocolloResponse>(_InoltraProtocolloResponse_QNAME, InoltraProtocolloResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocollo }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocollo }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocollo")
    public JAXBElement<RichiestaProtocollo> createRichiestaProtocollo(RichiestaProtocollo value) {
        return new JAXBElement<RichiestaProtocollo>(_RichiestaProtocollo_QNAME, RichiestaProtocollo.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloFasc }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloFasc }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocolloFasc")
    public JAXBElement<RichiestaProtocolloFasc> createRichiestaProtocolloFasc(RichiestaProtocolloFasc value) {
        return new JAXBElement<RichiestaProtocolloFasc>(_RichiestaProtocolloFasc_QNAME, RichiestaProtocolloFasc.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloFascResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloFascResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocolloFascResponse")
    public JAXBElement<RichiestaProtocolloFascResponse> createRichiestaProtocolloFascResponse(RichiestaProtocolloFascResponse value) {
        return new JAXBElement<RichiestaProtocolloFascResponse>(_RichiestaProtocolloFascResponse_QNAME, RichiestaProtocolloFascResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloProvvisorio }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloProvvisorio }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocolloProvvisorio")
    public JAXBElement<RichiestaProtocolloProvvisorio> createRichiestaProtocolloProvvisorio(RichiestaProtocolloProvvisorio value) {
        return new JAXBElement<RichiestaProtocolloProvvisorio>(_RichiestaProtocolloProvvisorio_QNAME, RichiestaProtocolloProvvisorio.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloProvvisorioResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloProvvisorioResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocolloProvvisorioResponse")
    public JAXBElement<RichiestaProtocolloProvvisorioResponse> createRichiestaProtocolloProvvisorioResponse(RichiestaProtocolloProvvisorioResponse value) {
        return new JAXBElement<RichiestaProtocolloProvvisorioResponse>(_RichiestaProtocolloProvvisorioResponse_QNAME, RichiestaProtocolloProvvisorioResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocolloResponse")
    public JAXBElement<RichiestaProtocolloResponse> createRichiestaProtocolloResponse(RichiestaProtocolloResponse value) {
        return new JAXBElement<RichiestaProtocolloResponse>(_RichiestaProtocolloResponse_QNAME, RichiestaProtocolloResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloUscita }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloUscita }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocolloUscita")
    public JAXBElement<RichiestaProtocolloUscita> createRichiestaProtocolloUscita(RichiestaProtocolloUscita value) {
        return new JAXBElement<RichiestaProtocolloUscita>(_RichiestaProtocolloUscita_QNAME, RichiestaProtocolloUscita.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloUscitaFasc }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloUscitaFasc }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocolloUscitaFasc")
    public JAXBElement<RichiestaProtocolloUscitaFasc> createRichiestaProtocolloUscitaFasc(RichiestaProtocolloUscitaFasc value) {
        return new JAXBElement<RichiestaProtocolloUscitaFasc>(_RichiestaProtocolloUscitaFasc_QNAME, RichiestaProtocolloUscitaFasc.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloUscitaFascResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloUscitaFascResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocolloUscitaFascResponse")
    public JAXBElement<RichiestaProtocolloUscitaFascResponse> createRichiestaProtocolloUscitaFascResponse(RichiestaProtocolloUscitaFascResponse value) {
        return new JAXBElement<RichiestaProtocolloUscitaFascResponse>(_RichiestaProtocolloUscitaFascResponse_QNAME, RichiestaProtocolloUscitaFascResponse.class, null, value);
    }

    /**
     * Create an instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloUscitaResponse }{@code >}
     * 
     * @param value
     *     Java instance representing xml element's value.
     * @return
     *     the new instance of {@link JAXBElement }{@code <}{@link RichiestaProtocolloUscitaResponse }{@code >}
     */
    @XmlElementDecl(namespace = "http://server.ws.protocollo.linksmt.it/", name = "richiestaProtocolloUscitaResponse")
    public JAXBElement<RichiestaProtocolloUscitaResponse> createRichiestaProtocolloUscitaResponse(RichiestaProtocolloUscitaResponse value) {
        return new JAXBElement<RichiestaProtocolloUscitaResponse>(_RichiestaProtocolloUscitaResponse_QNAME, RichiestaProtocolloUscitaResponse.class, null, value);
    }

}
