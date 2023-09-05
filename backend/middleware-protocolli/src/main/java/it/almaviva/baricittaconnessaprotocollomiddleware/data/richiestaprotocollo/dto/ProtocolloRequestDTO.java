
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.List;

@Data
@ApiModel(value = "ProtocolloRequestDTO", description = "Input richiesta protocollo")
public class ProtocolloRequestDTO {
    @ApiModelProperty(value = "Anagrafica", required = false)
    private AnagraficaDTO anagrafica;
    @ApiModelProperty(value = "Dati Istanza", required = false)
    private DatiIstanzaDTO dati_istanza;
    @ApiModelProperty(value = "Tipologia Pratica", required = false)
    private String tipologia_pratica;
    @ApiModelProperty(value = "Nome", required = false)
    private String nome;
    @ApiModelProperty(value = "Cognome", required = false)
    private String cognome;
    @ApiModelProperty(value = "Comunicazione Cittadino", required = false, hidden = true)
    private Boolean comunicazioneCittadino;
    @ApiModelProperty(value = "Destinatari", required = false, hidden = true)
    private List<DestinatariDTO> destinatari;
    @ApiModelProperty(value = "UOID", required = false, hidden = true)
    private String uoid;
}
