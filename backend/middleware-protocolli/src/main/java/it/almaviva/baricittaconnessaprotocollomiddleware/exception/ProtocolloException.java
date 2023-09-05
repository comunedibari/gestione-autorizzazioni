package it.almaviva.baricittaconnessaprotocollomiddleware.exception;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ProtocolloException extends RuntimeException {
  private Date timestamp = new Date();
  private int status;
  private String message;
  private String path;
  private String code;
  private String description;
  private String moreInfo;
  private String[] error;


  public ProtocolloException(Exception e) {
    super(e);
  }

  public ProtocolloException(String message, Exception e) {
    super(message, e);
    this.message = message;
  }

  public ProtocolloException(String message) {
    super(message);
    this.message = message;
  }

  private static final long serialVersionUID = 1L;

}
