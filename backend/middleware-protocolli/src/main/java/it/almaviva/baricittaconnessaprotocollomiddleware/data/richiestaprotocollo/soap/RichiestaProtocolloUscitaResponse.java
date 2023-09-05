
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap;

import lombok.ToString;

import javax.xml.bind.annotation.*;
import javax.xml.datatype.XMLGregorianCalendar;


/**
 * <p>Java class for richiestaProtocolloUscitaResponse complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="richiestaProtocolloUscitaResponse"&gt;
 *   &lt;complexContent&gt;
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *       &lt;sequence&gt;
 *         &lt;element name="return" minOccurs="0"&gt;
 *           &lt;complexType&gt;
 *             &lt;complexContent&gt;
 *               &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *                 &lt;sequence&gt;
 *                   &lt;element name="numeroProtocollo" type="{http://www.w3.org/2001/XMLSchema}long" minOccurs="0"/&gt;
 *                   &lt;element name="anno" type="{http://www.w3.org/2001/XMLSchema}int"/&gt;
 *                   &lt;element name="dataProtocollo" type="{http://www.w3.org/2001/XMLSchema}dateTime" minOccurs="0"/&gt;
 *                   &lt;element name="errore" type="{http://protocollo.linksmt.it/RichiestaSOAP}Errore" minOccurs="0"/&gt;
 *                   &lt;element name="esitoProtocollazione" type="{http://www.w3.org/2001/XMLSchema}boolean" minOccurs="0"/&gt;
 *                   &lt;element name="esitoCompletamentoProtocollo" type="{http://www.w3.org/2001/XMLSchema}boolean" minOccurs="0"/&gt;
 *                   &lt;element name="esitoInvio" type="{http://www.w3.org/2001/XMLSchema}boolean" minOccurs="0"/&gt;
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
@XmlType(name = "richiestaProtocolloUscitaResponse", namespace = "http://server.ws.protocollo.linksmt.it/", propOrder = {
    "_return"
})
@ToString
public class RichiestaProtocolloUscitaResponse {

    @XmlElement(name = "return")
    protected RichiestaProtocolloUscitaResponse.Return _return;

    /**
     * Gets the value of the return property.
     * 
     * @return
     *     possible object is
     *     {@link RichiestaProtocolloUscitaResponse.Return }
     *     
     */
    public RichiestaProtocolloUscitaResponse.Return getReturn() {
        return _return;
    }

    /**
     * Sets the value of the return property.
     * 
     * @param value
     *     allowed object is
     *     {@link RichiestaProtocolloUscitaResponse.Return }
     *     
     */
    public void setReturn(RichiestaProtocolloUscitaResponse.Return value) {
        this._return = value;
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
     *         &lt;element name="numeroProtocollo" type="{http://www.w3.org/2001/XMLSchema}long" minOccurs="0"/&gt;
     *         &lt;element name="anno" type="{http://www.w3.org/2001/XMLSchema}int"/&gt;
     *         &lt;element name="dataProtocollo" type="{http://www.w3.org/2001/XMLSchema}dateTime" minOccurs="0"/&gt;
     *         &lt;element name="errore" type="{http://protocollo.linksmt.it/RichiestaSOAP}Errore" minOccurs="0"/&gt;
     *         &lt;element name="esitoProtocollazione" type="{http://www.w3.org/2001/XMLSchema}boolean" minOccurs="0"/&gt;
     *         &lt;element name="esitoCompletamentoProtocollo" type="{http://www.w3.org/2001/XMLSchema}boolean" minOccurs="0"/&gt;
     *         &lt;element name="esitoInvio" type="{http://www.w3.org/2001/XMLSchema}boolean" minOccurs="0"/&gt;
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
        "numeroProtocollo",
        "anno",
        "dataProtocollo",
        "errore",
        "esitoProtocollazione",
        "esitoCompletamentoProtocollo",
        "esitoInvio"
    })
    @ToString
    public static class Return {

        protected Long numeroProtocollo;
        protected int anno;
        @XmlSchemaType(name = "dateTime")
        protected XMLGregorianCalendar dataProtocollo;
        protected Errore errore;
        protected Boolean esitoProtocollazione;
        protected Boolean esitoCompletamentoProtocollo;
        protected Boolean esitoInvio;

        /**
         * Gets the value of the numeroProtocollo property.
         * 
         * @return
         *     possible object is
         *     {@link Long }
         *     
         */
        public Long getNumeroProtocollo() {
            return numeroProtocollo;
        }

        /**
         * Sets the value of the numeroProtocollo property.
         * 
         * @param value
         *     allowed object is
         *     {@link Long }
         *     
         */
        public void setNumeroProtocollo(Long value) {
            this.numeroProtocollo = value;
        }

        /**
         * Gets the value of the anno property.
         * 
         */
        public int getAnno() {
            return anno;
        }

        /**
         * Sets the value of the anno property.
         * 
         */
        public void setAnno(int value) {
            this.anno = value;
        }

        /**
         * Gets the value of the dataProtocollo property.
         * 
         * @return
         *     possible object is
         *     {@link XMLGregorianCalendar }
         *     
         */
        public XMLGregorianCalendar getDataProtocollo() {
            return dataProtocollo;
        }

        /**
         * Sets the value of the dataProtocollo property.
         * 
         * @param value
         *     allowed object is
         *     {@link XMLGregorianCalendar }
         *     
         */
        public void setDataProtocollo(XMLGregorianCalendar value) {
            this.dataProtocollo = value;
        }

        /**
         * Gets the value of the errore property.
         * 
         * @return
         *     possible object is
         *     {@link Errore }
         *     
         */
        public Errore getErrore() {
            return errore;
        }

        /**
         * Sets the value of the errore property.
         * 
         * @param value
         *     allowed object is
         *     {@link Errore }
         *     
         */
        public void setErrore(Errore value) {
            this.errore = value;
        }

        /**
         * Gets the value of the esitoProtocollazione property.
         * 
         * @return
         *     possible object is
         *     {@link Boolean }
         *     
         */
        public Boolean isEsitoProtocollazione() {
            return esitoProtocollazione;
        }

        /**
         * Sets the value of the esitoProtocollazione property.
         * 
         * @param value
         *     allowed object is
         *     {@link Boolean }
         *     
         */
        public void setEsitoProtocollazione(Boolean value) {
            this.esitoProtocollazione = value;
        }

        /**
         * Gets the value of the esitoCompletamentoProtocollo property.
         * 
         * @return
         *     possible object is
         *     {@link Boolean }
         *     
         */
        public Boolean isEsitoCompletamentoProtocollo() {
            return esitoCompletamentoProtocollo;
        }

        /**
         * Sets the value of the esitoCompletamentoProtocollo property.
         * 
         * @param value
         *     allowed object is
         *     {@link Boolean }
         *     
         */
        public void setEsitoCompletamentoProtocollo(Boolean value) {
            this.esitoCompletamentoProtocollo = value;
        }

        /**
         * Gets the value of the esitoInvio property.
         * 
         * @return
         *     possible object is
         *     {@link Boolean }
         *     
         */
        public Boolean isEsitoInvio() {
            return esitoInvio;
        }

        /**
         * Sets the value of the esitoInvio property.
         * 
         * @param value
         *     allowed object is
         *     {@link Boolean }
         *     
         */
        public void setEsitoInvio(Boolean value) {
            this.esitoInvio = value;
        }

    }

}
