package it.almaviva.baricittaconnessaprotocollomiddleware.exception;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Date;

@Getter
@Setter
@ToString
public class BadRequestException extends RuntimeException {

	private Date timestamp=new Date();
	private int status;
	private String message;
	private String path;
	private String code;
	private String description;
	private String moreInfo;
	private String[] error;

	public BadRequestException(String message) {
		super(message);
		this.message = message;
	}

	public BadRequestException(int status, String message) {
		super();
		this.status = status;
		this.message = message;
	}

	/**
	 *
	 */
	private static final long serialVersionUID = 1L;
}
