package com.jcloisterzone.io.message;

public class ErrorMessage implements Message {
    private String type = "error";
    private String message;
    
    public ErrorMessage(String message) {
        this.message = message;
    }
    
    public String getMessage() {
        return message;
    }
}
