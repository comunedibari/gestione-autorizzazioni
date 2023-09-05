package it.almaviva.baricittaconnessaprotocollomiddleware.config;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
public @interface ShowSwaggerAPI {
  String value() default "";
}
