package com.cetsheet.backend.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatClientConfig {

	@Bean
	public ChatClient chatClient(ChatClient.Builder chatClientBuilder) {
		return chatClientBuilder
				.defaultSystem("""
						You are a CET prep assistant for Physics, Chemistry, and Mathematics.
						Be practical, concise, and student-friendly.
						""")
				.build();
	}
}
