
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap;

import lombok.ToString;

import javax.xml.bind.annotation.*;
import java.util.Arrays;


/**
 * <p>Java class for Documento complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="Documento"&gt;
 *   &lt;complexContent&gt;
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *       &lt;sequence&gt;
 *         &lt;element name="titolo" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *         &lt;element name="sunto" type="{http://www.w3.org/2001/XMLSchema}string" minOccurs="0"/&gt;
 *         &lt;element name="dettaglio" type="{http://www.w3.org/2001/XMLSchema}string" minOccurs="0"/&gt;
 *         &lt;element name="nomeFile" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *         &lt;element name="classifica" type="{http://www.w3.org/2001/XMLSchema}string" minOccurs="0"/&gt;
 *         &lt;element name="contenuto" type="{http://www.w3.org/2001/XMLSchema}base64Binary"/&gt;
 *         &lt;element name="improntaMIME" type="{http://protocollo.linksmt.it/RichiestaSOAP}ImprontaMIME" minOccurs="0"/&gt;
 *         &lt;element name="collocazioneTelematica" type="{http://www.w3.org/2001/XMLSchema}string" minOccurs="0"/&gt;
 *       &lt;/sequence&gt;
 *       &lt;attribute name="tipoRiferimento" type="{http://www.w3.org/2001/XMLSchema}string" /&gt;
 *     &lt;/restriction&gt;
 *   &lt;/complexContent&gt;
 * &lt;/complexType&gt;
 * </pre>
 * 
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "Documento", propOrder = {
    "titolo",
    "sunto",
    "dettaglio",
    "nomeFile",
    "classifica",
    "contenuto",
    "improntaMIME",
    "collocazioneTelematica"
})
public class Documento {

    @XmlElement(required = true)
    protected String titolo;
    protected String sunto;
    protected String dettaglio;
    @XmlElement(required = true)
    protected String nomeFile;
    protected String classifica;
    @XmlElement(required = true)
    protected byte[] contenuto;
    protected ImprontaMIME improntaMIME;
    protected String collocazioneTelematica;
    @XmlAttribute(name = "tipoRiferimento")
    protected String tipoRiferimento;

    /**
     * Gets the value of the titolo property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getTitolo() {
        return titolo;
    }

    /**
     * Sets the value of the titolo property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setTitolo(String value) {
        this.titolo = value;
    }

    /**
     * Gets the value of the sunto property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getSunto() {
        return sunto;
    }

    /**
     * Sets the value of the sunto property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setSunto(String value) {
        this.sunto = value;
    }

    /**
     * Gets the value of the dettaglio property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getDettaglio() {
        return dettaglio;
    }

    /**
     * Sets the value of the dettaglio property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setDettaglio(String value) {
        this.dettaglio = value;
    }

    /**
     * Gets the value of the nomeFile property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getNomeFile() {
        return nomeFile;
    }

    /**
     * Sets the value of the nomeFile property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setNomeFile(String value) {
        this.nomeFile = value;
    }

    /**
     * Gets the value of the classifica property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getClassifica() {
        return classifica;
    }

    /**
     * Sets the value of the classifica property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setClassifica(String value) {
        this.classifica = value;
    }

    /**
     * Gets the value of the contenuto property.
     * 
     * @return
     *     possible object is
     *     byte[]
     */
    public byte[] getContenuto() {
        return contenuto;
    }

    /**
     * Sets the value of the contenuto property.
     * 
     * @param value
     *     allowed object is
     *     byte[]
     */
    public void setContenuto(byte[] value) {
        this.contenuto = value;
    }

    /**
     * Gets the value of the improntaMIME property.
     * 
     * @return
     *     possible object is
     *     {@link ImprontaMIME }
     *     
     */
    public ImprontaMIME getImprontaMIME() {
        return improntaMIME;
    }

    /**
     * Sets the value of the improntaMIME property.
     * 
     * @param value
     *     allowed object is
     *     {@link ImprontaMIME }
     *     
     */
    public void setImprontaMIME(ImprontaMIME value) {
        this.improntaMIME = value;
    }

    /**
     * Gets the value of the collocazioneTelematica property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getCollocazioneTelematica() {
        return collocazioneTelematica;
    }

    /**
     * Sets the value of the collocazioneTelematica property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setCollocazioneTelematica(String value) {
        this.collocazioneTelematica = value;
    }

    /**
     * Gets the value of the tipoRiferimento property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getTipoRiferimento() {
        return tipoRiferimento;
    }

    /**
     * Sets the value of the tipoRiferimento property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setTipoRiferimento(String value) {
        this.tipoRiferimento = value;
    }

    @Override
    public String toString() {
        return "Documento{" +
                "titolo='" + titolo + '\'' +
                ", sunto='" + sunto + '\'' +
                ", dettaglio='" + dettaglio + '\'' +
                ", nomeFile='" + nomeFile + '\'' +
                ", classifica='" + classifica + '\'' +
                ", contenuto bytes=" + contenuto.length +
                ", improntaMIME=" + improntaMIME +
                ", collocazioneTelematica='" + collocazioneTelematica + '\'' +
                ", tipoRiferimento='" + tipoRiferimento + '\'' +
                '}';
    }
}
