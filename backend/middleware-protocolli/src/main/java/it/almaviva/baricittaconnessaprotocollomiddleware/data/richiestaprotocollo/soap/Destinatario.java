
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.soap;

import lombok.ToString;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlType;


/**
 * <p>Java class for Destinatario complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="Destinatario"&gt;
 *   &lt;complexContent&gt;
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType"&gt;
 *       &lt;sequence&gt;
 *         &lt;element name="areaOrganizzativaOmogenea" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *         &lt;element name="personaFisica" type="{http://protocollo.linksmt.it/RichiestaSOAP}PersonaFisica"/&gt;
 *         &lt;element name="amministrazione" type="{http://www.w3.org/2001/XMLSchema}string"/&gt;
 *       &lt;/sequence&gt;
 *     &lt;/restriction&gt;
 *   &lt;/complexContent&gt;
 * &lt;/complexType&gt;
 * </pre>
 * 
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "Destinatario", propOrder = {
    "areaOrganizzativaOmogenea",
    "personaFisica",
    "amministrazione"
})
@ToString
public class Destinatario {

    @XmlElement(required = true)
    protected String areaOrganizzativaOmogenea;
    @XmlElement(required = true)
    protected PersonaFisica personaFisica;
    @XmlElement(required = true)
    protected String amministrazione;

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
     * Gets the value of the personaFisica property.
     * 
     * @return
     *     possible object is
     *     {@link PersonaFisica }
     *     
     */
    public PersonaFisica getPersonaFisica() {
        return personaFisica;
    }

    /**
     * Sets the value of the personaFisica property.
     * 
     * @param value
     *     allowed object is
     *     {@link PersonaFisica }
     *     
     */
    public void setPersonaFisica(PersonaFisica value) {
        this.personaFisica = value;
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

}
