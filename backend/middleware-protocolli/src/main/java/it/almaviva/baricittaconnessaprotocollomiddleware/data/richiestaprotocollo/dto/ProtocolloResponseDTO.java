
package it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProtocolloResponseDTO {
    private Long numeroProtocollo;
    private int anno;
    private LocalDateTime dataProtocollo;

    private ErroreDTO errore;
}
