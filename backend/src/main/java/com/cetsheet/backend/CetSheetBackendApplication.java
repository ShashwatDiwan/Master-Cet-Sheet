package com.cetsheet.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CetSheetBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(CetSheetBackendApplication.class, args);
	}

}
