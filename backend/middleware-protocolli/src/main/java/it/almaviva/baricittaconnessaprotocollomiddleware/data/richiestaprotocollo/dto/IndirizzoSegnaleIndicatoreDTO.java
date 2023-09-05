
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class IndirizzoSegnaleIndicatoreDTO {
    private String indirizzo;
    private Integer municipio_id;
}
