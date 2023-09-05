
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
 *         &lt;element name="numeroProtocollo" type="{http://www.w3.org/2001/XMLSchema}int"/&gt;
 *         &lt;element name="anno" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *         &lt;element name="destinatarioUser" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *         &lt;element name="mittenteUser" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *         &lt;element name="tipoInoltro" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *         &lt;element name="note" type="{http://www.w3.org/2001/XMLSchema}string" minOccurs="0"/&gt;
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
    "destinatarioUser",
    "mittenteUser",
    "tipoInoltro",
    "note"
})
@XmlRootElement(name = "inoltroProtocolloRequest")
@ToString
public class InoltroProtocolloRequest {

    protected int numeroProtocollo;
    @XmlElement(required = true)
    protected String anno;
    @XmlElement(required = true)
    protected String destinatarioUser;
    @XmlElement(required = true)
    protected String mittenteUser;
    @XmlElement(required = true)
    protected String tipoInoltro;
    protected String note;

    /**
     * Gets the value of the numeroProtocollo property.
     * 
     */
    public int getNumeroProtocollo() {
        return numeroProtocollo;
    }

    /**
     * Sets the value of the numeroProtocollo property.
     * 
     */
    public void setNumeroProtocollo(int value) {
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
     * Gets the value of the destinatarioUser property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getDestinatarioUser() {
        return destinatarioUser;
    }

    /**
     * Sets the value of the destinatarioUser property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setDestinatarioUser(String value) {
        this.destinatarioUser = value;
    }

    /**
     * Gets the value of the mittenteUser property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getMittenteUser() {
        return mittenteUser;
    }

    /**
     * Sets the value of the mittenteUser property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setMittenteUser(String value) {
        this.mittenteUser = value;
    }

    /**
     * Gets the value of the tipoInoltro property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getTipoInoltro() {
        return tipoInoltro;
    }

    /**
     * Sets the value of the tipoInoltro property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setTipoInoltro(String value) {
        this.tipoInoltro = value;
    }

    /**
     * Gets the value of the note property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getNote() {
        return note;
    }

    /**
     * Sets the value of the note property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setNote(String value) {
        this.note = value;
    }

}
