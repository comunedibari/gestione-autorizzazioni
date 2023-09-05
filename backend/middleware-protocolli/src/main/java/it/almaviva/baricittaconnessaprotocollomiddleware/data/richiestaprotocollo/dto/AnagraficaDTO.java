
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto;

import lombok.Data;

@Data
public class AnagraficaDTO {
    private String codice_fiscale;
    private String codice_fiscale_piva;
    private String cognome;
    private String nome;
    private String ragione_sociale;
    private String tipologia_persona;
}
