package org.kotemaru.jsrpc;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public interface JsrpcEnvironment extends java.io.Serializable {
	public void setHttpServletRequest(HttpServletRequest req);
	public void setHttpServletResponse(HttpServletResponse res);
	public boolean isSaveSession();
}
