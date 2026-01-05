package com.community.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /resources/** URL 요청을
        // 1. classpath:/static/resources/ (빌드된 jar 내부)
        // 2. file:./public/resources/ (프로젝트 루트의 public 폴더 - 개발 환경용)
        // 에서 찾도록 설정합니다.
        registry.addResourceHandler("/resources/**")
                .addResourceLocations("classpath:/static/resources/", "file:../public/resources/");
    }
}
