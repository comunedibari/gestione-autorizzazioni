
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap;

import lombok.ToString;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlType;


/**
 * <p>Java class for getAllegato complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="getAllegato"&gt;
 *   &lt;complexContent&gt;
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *       &lt;sequence&gt;
 *         &lt;element name="dettaglioAllegatoRequest" minOccurs="0"&gt;
 *           &lt;complexType&gt;
 *             &lt;complexContent&gt;
 *               &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *                 &lt;sequence&gt;
 *                   &lt;element name="identificativo" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
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
@XmlType(name = "getAllegato", namespace = "http://server.ws.protocollo.linksmt.it/", propOrder = {
    "dettaglioAllegatoRequest"
})
@ToString
public class GetAllegato {

    protected GetAllegato.DettaglioAllegatoRequest dettaglioAllegatoRequest;

    /**
     * Gets the value of the dettaglioAllegatoRequest property.
     * 
     * @return
     *     possible object is
     *     {@link GetAllegato.DettaglioAllegatoRequest }
     *     
     */
    public GetAllegato.DettaglioAllegatoRequest getDettaglioAllegatoRequest() {
        return dettaglioAllegatoRequest;
    }

    /**
     * Sets the value of the dettaglioAllegatoRequest property.
     * 
     * @param value
     *     allowed object is
     *     {@link GetAllegato.DettaglioAllegatoRequest }
     *     
     */
    public void setDettaglioAllegatoRequest(GetAllegato.DettaglioAllegatoRequest value) {
        this.dettaglioAllegatoRequest = value;
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
     *         &lt;element name="identificativo" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
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
        "identificativo"
    })
    public static class DettaglioAllegatoRequest {

        @XmlElement(required = true)
        protected String identificativo;

        /**
         * Gets the value of the identificativo property.
         * 
         * @return
         *     possible object is
         *     {@link String }
         *     
         */
        public String getIdentificativo() {
            return identificativo;
        }

        /**
         * Sets the value of the identificativo property.
         * 
         * @param value
         *     allowed object is
         *     {@link String }
         *     
         */
        public void setIdentificativo(String value) {
            this.identificativo = value;
        }

    }

}
