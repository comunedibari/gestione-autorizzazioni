
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap;

import lombok.ToString;

import javax.xml.bind.annotation.*;


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
 *         &lt;element name="documento" type="{http://protocollo.linksmt.it/RichiestaSOAP}Documento"/&gt;
 *         &lt;element name="amministrazione" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *         &lt;element name="areaOrganizzativaOmogenea" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *         &lt;element name="idUtente" type="{http://www.w3.org/2001/XMLSchema}int" minOccurs="0"/&gt;
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
    "documento",
    "amministrazione",
    "areaOrganizzativaOmogenea",
    "idUtente"
})
@XmlRootElement(name = "protocolloDaCompletareRequest")
@ToString
public class ProtocolloDaCompletareRequest {

    protected long numeroProtocollo;
    @XmlElement(required = true)
    protected String anno;
    @XmlElement(required = true)
    protected Documento documento;
    @XmlElement(required = true)
    protected String amministrazione;
    @XmlElement(required = true)
    protected String areaOrganizzativaOmogenea;
    protected Integer idUtente;

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

}
