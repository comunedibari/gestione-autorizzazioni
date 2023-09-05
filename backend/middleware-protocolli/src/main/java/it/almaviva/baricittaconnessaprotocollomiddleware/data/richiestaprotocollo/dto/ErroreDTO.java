
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.xml.bind.annotation.XmlElement;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErroreDTO {
    private String codice;
    private String descrizione;
}
