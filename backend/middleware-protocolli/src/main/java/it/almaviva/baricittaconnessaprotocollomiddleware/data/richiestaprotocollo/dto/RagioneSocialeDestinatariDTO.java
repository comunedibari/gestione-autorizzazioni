package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto;

import lombok.Data;

@Data
public class RagioneSocialeDestinatariDTO {
    private String uoid;
    private String group_id;
    private String codicefiscale;
    private String ragioneSociale;
    private String denominazione;
    private boolean enabled;
}
