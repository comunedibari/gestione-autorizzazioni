package it.almaviva.baricittaconnessaprotocollomiddleware.rest;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RequiredArgsConstructor
@RestController
@RequestMapping(value = "/middleware/v1/info", produces = {MediaType.APPLICATION_JSON_VALUE})
public class InfoController extends AbstractController {
    @Value("${build.version}")
    private String buildVersion;

    @GetMapping
    public ResponseEntity<String> getBuildVersion() {
        return ResponseEntity.status(HttpStatus.OK).body(buildVersion);
    }
}
