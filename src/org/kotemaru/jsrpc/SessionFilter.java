package org.kotemaru.jsrpc;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.*;

import org.kotemaru.util.HttpRequestContext;
import org.kotemaru.util.IOUtil;
import org.kotemaru.util.json.JSONParser;
import org.kotemaru.util.json.JSONSerializer;
import org.slim3.controller.upload.*;

@SuppressWarnings("serial")
public class SessionFilter implements Filter {

	public void init(FilterConfig conf) throws ServletException {
	}

	public void doFilter(ServletRequest req, ServletResponse res,
			FilterChain chain) throws ServletException, IOException {

		chain.doFilter(req, res);

		HttpServletRequest _req = (HttpServletRequest) req;
		HttpServletResponse _res = (HttpServletResponse) res;
		HttpSession session = _req.getSession();
		Cookie jsid = new Cookie("JSESSIONID",session.getId());
		jsid.setMaxAge(session.getMaxInactiveInterval());
		jsid.setPath("/");
		_res.addCookie(jsid);
	}

	public void destroy() {
	}
}