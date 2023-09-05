package it.almaviva.baricittaconnessaprotocollomiddleware.rest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.ws.client.WebServiceIOException;

public class AbstractController {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleGenericException(HttpMessageNotReadableException e){
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getLocalizedMessage());
    }

    // Al momento si valuta di rispondere sempre con SERVICE_UNAVAILABLE se si incontra una eccezione
    @ExceptionHandler(WebServiceIOException.class)
    public ResponseEntity<?> handleGenericException(Exception e){
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(null);
    }

}
