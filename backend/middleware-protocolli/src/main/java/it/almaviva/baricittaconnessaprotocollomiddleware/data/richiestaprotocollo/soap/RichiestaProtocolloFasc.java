
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap;

import lombok.ToString;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlType;
import java.util.ArrayList;
import java.util.List;


/**
 * <p>Java class for richiestaProtocolloFasc complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="richiestaProtocolloFasc"&gt;
 *   &lt;complexContent&gt;
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *       &lt;sequence&gt;
 *         &lt;element name="protocolloFascRequest" minOccurs="0"&gt;
 *           &lt;complexType&gt;
 *             &lt;complexContent&gt;
 *               &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *                 &lt;sequence&gt;
 *                   &lt;element name="mittente" type="{http://protocollo.linksmt.it/RichiestaSOAP}Mittente"/&gt;
 *                   &lt;element name="destinatari" type="{http://protocollo.linksmt.it/RichiestaSOAP}Destinatario" maxOccurs="unbounded" minOccurs="0"/&gt;
 *                   &lt;element name="documento" type="{http://protocollo.linksmt.it/RichiestaSOAP}Documento"/&gt;
 *                   &lt;element name="allegati" type="{http://protocollo.linksmt.it/RichiestaSOAP}Allegato" maxOccurs="unbounded" minOccurs="0"/&gt;
 *                   &lt;element name="areaOrganizzativaOmogenea" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *                   &lt;element name="amministrazione" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *                   &lt;element name="oggetto" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *                   &lt;element name="idUtente" type="{http://www.w3.org/2001/XMLSchema}int" minOccurs="0"/&gt;
 *                   &lt;element name="idFascicolo" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *                   &lt;element name="idTitolario" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *                 &lt;/sequence&gt;
 *               &lt;/restriction&gt;
 *             &lt;/complexContent&gt;
 *           &lt;/complexType&gt;
 *         &lt;/element&gt;
 *       &lt;/sequence&gt;
 *     &lt;/restriction&gt;
 *   &lt;/complexContent&gt;
 * &lt;/complexType&gt;
 * </pre>
 * 
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "richiestaProtocolloFasc", namespace = "http://server.ws.protocollo.linksmt.it/", propOrder = {
    "protocolloFascRequest"
})
@ToString
public class RichiestaProtocolloFasc {

    protected RichiestaProtocolloFasc.ProtocolloFascRequest protocolloFascRequest;

    /**
     * Gets the value of the protocolloFascRequest property.
     * 
     * @return
     *     possible object is
     *     {@link RichiestaProtocolloFasc.ProtocolloFascRequest }
     *     
     */
    public RichiestaProtocolloFasc.ProtocolloFascRequest getProtocolloFascRequest() {
        return protocolloFascRequest;
    }

    /**
     * Sets the value of the protocolloFascRequest property.
     * 
     * @param value
     *     allowed object is
     *     {@link RichiestaProtocolloFasc.ProtocolloFascRequest }
     *     
     */
    public void setProtocolloFascRequest(RichiestaProtocolloFasc.ProtocolloFascRequest value) {
        this.protocolloFascRequest = value;
    }


    /**
     * <p>Java class for anonymous complex type.
     * 
     * <p>The following schema fragment specifies the expected content contained within this class.
     * 
     * <pre>
     * &lt;complexType&gt;
     *   &lt;complexContent&gt;
     *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
     *       &lt;sequence&gt;
     *         &lt;element name="mittente" type="{http://protocollo.linksmt.it/RichiestaSOAP}Mittente"/&gt;
     *         &lt;element name="destinatari" type="{http://protocollo.linksmt.it/RichiestaSOAP}Destinatario" maxOccurs="unbounded" minOccurs="0"/&gt;
     *         &lt;element name="documento" type="{http://protocollo.linksmt.it/RichiestaSOAP}Documento"/&gt;
     *         &lt;element name="allegati" type="{http://protocollo.linksmt.it/RichiestaSOAP}Allegato" maxOccurs="unbounded" minOccurs="0"/&gt;
     *         &lt;element name="areaOrganizzativaOmogenea" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
     *         &lt;element name="amministrazione" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
     *         &lt;element name="oggetto" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
     *         &lt;element name="idUtente" type="{http://www.w3.org/2001/XMLSchema}int" minOccurs="0"/&gt;
     *         &lt;element name="idFascicolo" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
     *         &lt;element name="idTitolario" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
     *       &lt;/sequence&gt;
     *     &lt;/restriction&gt;
     *   &lt;/complexContent&gt;
     * &lt;/complexType&gt;
     * </pre>
     * 
     * 
     */
    @XmlAccessorType(XmlAccessType.FIELD)
    @XmlType(name = "", propOrder = {
        "mittente",
        "destinatari",
        "documento",
        "allegati",
        "areaOrganizzativaOmogenea",
        "amministrazione",
        "oggetto",
        "idUtente",
        "idFascicolo",
        "idTitolario"
    })
    public static class ProtocolloFascRequest {

        @XmlElement(required = true)
        protected Mittente mittente;
        @XmlElement(nillable = true)
        protected List<Destinatario> destinatari;
        @XmlElement(required = true)
        protected Documento documento;
        @XmlElement(nillable = true)
        protected List<Allegato> allegati;
        @XmlElement(required = true)
        protected String areaOrganizzativaOmogenea;
        @XmlElement(required = true)
        protected String amministrazione;
        @XmlElement(required = true)
        protected String oggetto;
        protected Integer idUtente;
        @XmlElement(required = true)
        protected String idFascicolo;
        @XmlElement(required = true)
        protected String idTitolario;

        /**
         * Gets the value of the mittente property.
         * 
         * @return
         *     possible object is
         *     {@link Mittente }
         *     
         */
        public Mittente getMittente() {
            return mittente;
        }

        /**
         * Sets the value of the mittente property.
         * 
         * @param value
         *     allowed object is
         *     {@link Mittente }
         *     
         */
        public void setMittente(Mittente value) {
            this.mittente = value;
        }

        /**
         * Gets the value of the destinatari property.
         * 
         * <p>
         * This accessor method returns a reference to the live list,
         * not a snapshot. Therefore any modification you make to the
         * returned list will be present inside the JAXB object.
         * This is why there is not a <CODE>set</CODE> method for the destinatari property.
         * 
         * <p>
         * For example, to add a new item, do as follows:
         * <pre>
         *    getDestinatari().add(newItem);
         * </pre>
         * 
         * 
         * <p>
         * Objects of the following type(s) are allowed in the list
         * {@link Destinatario }
         * 
         * 
         */
        public List<Destinatario> getDestinatari() {
            if (destinatari == null) {
                destinatari = new ArrayList<Destinatario>();
            }
            return this.destinatari;
        }

        /**
         * Gets the value of the documento property.
         * 
         * @return
         *     possible object is
         *     {@link Documento }
         *     
         */
        public Documento getDocumento() {
            return documento;
        }

        /**
         * Sets the value of the documento property.
         * 
         * @param value
         *     allowed object is
         *     {@link Documento }
         *     
         */
        public void setDocumento(Documento value) {
            this.documento = value;
        }

        /**
         * Gets the value of the allegati property.
         * 
         * <p>
         * This accessor method returns a reference to the live list,
         * not a snapshot. Therefore any modification you make to the
         * returned list will be present inside the JAXB object.
         * This is why there is not a <CODE>set</CODE> method for the allegati property.
         * 
         * <p>
         * For example, to add a new item, do as follows:
         * <pre>
         *    getAllegati().add(newItem);
         * </pre>
         * 
         * 
         * <p>
         * Objects of the following type(s) are allowed in the list
         * {@link Allegato }
         * 
         * 
         */
        public List<Allegato> getAllegati() {
            if (allegati == null) {
                allegati = new ArrayList<Allegato>();
            }
            return this.allegati;
        }

        /**
         * Gets the value of the areaOrganizzativaOmogenea property.
         * 
         * @return
         *     possible object is
         *     {@link String }
         *     
         */
        public String getAreaOrganizzativaOmogenea() {
            return areaOrganizzativaOmogenea;
        }

        /**
         * Sets the value of the areaOrganizzativaOmogenea property.
         * 
         * @param value
         *     allowed object is
         *     {@link String }
         *     
         */
        public void setAreaOrganizzativaOmogenea(String value) {
            this.areaOrganizzativaOmogenea = value;
        }

        /**
         * Gets the value of the amministrazione property.
         * 
         * @return
         *     possible object is
         *     {@link String }
         *     
         */
        public String getAmministrazione() {
            return amministrazione;
        }

        /**
         * Sets the value of the amministrazione property.
         * 
         * @param value
         *     allowed object is
         *     {@link String }
         *     
         */
        public void setAmministrazione(String value) {
            this.amministrazione = value;
        }

        /**
         * Gets the value of the oggetto property.
         * 
         * @return
         *     possible object is
         *     {@link String }
         *     
         */
        public String getOggetto() {
            return oggetto;
        }

        /**
         * Sets the value of the oggetto property.
         * 
         * @param value
         *     allowed object is
         *     {@link String }
         *     
         */
        public void setOggetto(String value) {
            this.oggetto = value;
        }

        /**
         * Gets the value of the idUtente property.
         * 
         * @return
         *     possible object is
         *     {@link Integer }
         *     
         */
        public Integer getIdUtente() {
            return idUtente;
        }

        /**
         * Sets the value of the idUtente property.
         * 
         * @param value
         *     allowed object is
         *     {@link Integer }
         *     
         */
        public void setIdUtente(Integer value) {
            this.idUtente = value;
        }

        /**
         * Gets the value of the idFascicolo property.
         * 
         * @return
         *     possible object is
         *     {@link String }
         *     
         */
        public String getIdFascicolo() {
            return idFascicolo;
        }

        /**
         * Sets the value of the idFascicolo property.
         * 
         * @param value
         *     allowed object is
         *     {@link String }
         *     
         */
        public void setIdFascicolo(String value) {
            this.idFascicolo = value;
        }

        /**
         * Gets the value of the idTitolario property.
         * 
         * @return
         *     possible object is
         *     {@link String }
         *     
         */
        public String getIdTitolario() {
            return idTitolario;
        }

        /**
         * Sets the value of the idTitolario property.
         * 
         * @param value
         *     allowed object is
         *     {@link String }
         *     
         */
        public void setIdTitolario(String value) {
            this.idTitolario = value;
        }

    }

}
