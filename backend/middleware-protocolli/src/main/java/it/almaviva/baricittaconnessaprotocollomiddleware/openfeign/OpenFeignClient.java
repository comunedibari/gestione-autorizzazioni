package it.almaviva.baricittaconnessaprotocollomiddleware.openfeign;

import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.DestinatariDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.RagioneSocialeDestinatariDTO;
import it.almaviva.baricittaconnessaprotocollomiddleware.data.richiestaprotocollo.dto.UoidDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;

@FeignClient(name ="openFeignClient", url = "${openfeign.bari.url}")
public interface OpenFeignClient {
  @RequestMapping(method = RequestMethod.POST, value = "/api/utility/getRagioneSocialeDestinatariSync")
  List<RagioneSocialeDestinatariDTO> getRagioneSocialeDestinatari(List<DestinatariDTO> destinatari);

  @RequestMapping(method = RequestMethod.GET, value = "/api/utility/getUOID/{municipioId}")
  UoidDTO getUOID(@PathVariable String municipioId);
}
