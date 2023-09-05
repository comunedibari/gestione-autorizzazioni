
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap;

import lombok.ToString;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlType;


/**
 * <p>Java class for getMittenteProtocollo complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="getMittenteProtocollo"&gt;
 *   &lt;complexContent&gt;
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *       &lt;sequence&gt;
 *         &lt;element name="mittenteProtocolloRequest" minOccurs="0"&gt;
 *           &lt;complexType&gt;
 *             &lt;complexContent&gt;
 *               &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *                 &lt;sequence&gt;
 *                   &lt;element name="numeroProtocollo" type="{http://www.w3.org/2001/XMLSchema}long"/&gt;
 *                   &lt;element name="anno" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
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
@XmlType(name = "getMittenteProtocollo", namespace = "http://server.ws.protocollo.linksmt.it/", propOrder = {
    "mittenteProtocolloRequest"
})
@ToString
public class GetMittenteProtocollo {

    protected GetMittenteProtocollo.MittenteProtocolloRequest mittenteProtocolloRequest;

    /**
     * Gets the value of the mittenteProtocolloRequest property.
     * 
     * @return
     *     possible object is
     *     {@link GetMittenteProtocollo.MittenteProtocolloRequest }
     *     
     */
    public GetMittenteProtocollo.MittenteProtocolloRequest getMittenteProtocolloRequest() {
        return mittenteProtocolloRequest;
    }

    /**
     * Sets the value of the mittenteProtocolloRequest property.
     * 
     * @param value
     *     allowed object is
     *     {@link GetMittenteProtocollo.MittenteProtocolloRequest }
     *     
     */
    public void setMittenteProtocolloRequest(GetMittenteProtocollo.MittenteProtocolloRequest value) {
        this.mittenteProtocolloRequest = value;
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
     *         &lt;element name="numeroProtocollo" type="{http://www.w3.org/2001/XMLSchema}long"/&gt;
     *         &lt;element name="anno" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
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
        "anno"
    })
    public static class MittenteProtocolloRequest {

        protected long numeroProtocollo;
        @XmlElement(required = true)
        protected String anno;

        /**
         * Gets the value of the numeroProtocollo property.
         * 
         */
        public long getNumeroProtocollo() {
            return numeroProtocollo;
        }

        /**
         * Sets the value of the numeroProtocollo property.
         * 
         */
        public void setNumeroProtocollo(long value) {
            this.numeroProtocollo = value;
        }

        /**
         * Gets the value of the anno property.
         * 
         * @return
         *     possible object is
         *     {@link String }
         *     
         */
        public String getAnno() {
            return anno;
        }

        /**
         * Sets the value of the anno property.
         * 
         * @param value
         *     allowed object is
         *     {@link String }
         *     
         */
        public void setAnno(String value) {
            this.anno = value;
        }

    }

}
