package it.almaviva.baricittaconnessaprotocollomiddleware.rest;

import it.almaviva.baricittaconnessaprotocollomiddleware.exception.AllegatiException;
import it.almaviva.baricittaconnessaprotocollomiddleware.exception.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@ControllerAdvice
public class ErrorController {

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Object> throwable(Exception exception) {
    return new ResponseEntity<>(addErrorInfo(exception, HttpStatus.INTERNAL_SERVER_ERROR), HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @ExceptionHandler(Throwable.class)
  public ResponseEntity<Object> throwable(Throwable throwable) {
    return new ResponseEntity<>(addErrorInfo(throwable, HttpStatus.INTERNAL_SERVER_ERROR), HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<Object> throwable(BadRequestException badRequestException) {
    return new ResponseEntity<>(addErrorInfo(badRequestException, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(AllegatiException.class)
  public ResponseEntity<Object> throwable(AllegatiException badRequestException) {
    return new ResponseEntity<>(addErrorInfo(badRequestException, HttpStatus.PAYLOAD_TOO_LARGE), HttpStatus.PAYLOAD_TOO_LARGE);
  }

  private Map<String, Object> addErrorInfo(Throwable exception, HttpStatus status) {

    Map<String, Object> body = new LinkedHashMap<>();

    body.put("timestamp", LocalDateTime.now());

    body.put("status", status);

    body.put("title", exception != null ? exception.getMessage() : "Unknown error");

    return body;
  }
}
