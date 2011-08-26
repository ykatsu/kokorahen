package org.kotemaru.jsrpc;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.*;

import org.kotemaru.util.HttpRequestContext;
import org.kotemaru.util.IOUtil;
import org.kotemaru.util.json.JSONParser;
import org.kotemaru.util.json.JSONSerializer;
import org.slim3.controller.upload.*;

@SuppressWarnings("serial")
public class CalljavaServlet extends HttpServlet {
	private static final String MIME_HTML = "text/html";
	private static final String MIME_JSON = "application/json";
	private static final String MIME_JS = "application/javascript";
	private static final String MIME_TEXT = "text/plain";
	private static final String MIME_MULTIPART = "multipart/form-data";
	private static final String JSRPC_KEEP = JsrpcEnvironment.class.getName();

	//private static final ThreadLocal<HttpRequestContext> httpRequestContext
	//	= new ThreadLocal<HttpRequestContext>();

	//public static HttpRequestContext getHttpRequestContext() {
	//	return httpRequestContext.get();
	//}


	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {

		//httpRequestContext.set(new HttpRequestContext(this, req, resp));

		String pinfo = req.getPathInfo();
		if (pinfo == null) return;
		try {
			callMethodForParam(req, resp);

		} catch (Exception e) {
			Throwable t = e;
			while (t.getCause() != null) {
				t = t.getCause();
			}
			throw new ServletException(t);
		}
	}

	public void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		//httpRequestContext.set(new HttpRequestContext(this, req, resp));

		try {
			String ctype = req.getContentType();
			if (ctype != null) ctype = ctype.toLowerCase();
			if (FileUpload.isMultipartContent(req)) {
				callMethodForMultiPart(req, resp);
			} else if (ctype.startsWith(MIME_JSON)) {
				callJsonRpc(req, resp);
			} else {
				callMethodForParam(req, resp);
			}

		} catch (Exception e) {
			Throwable t = e;
			while (t.getCause() != null) {
				t = t.getCause();
			}
			throw new ServletException(t);
		}
	}


	private Object getInstance(Class cls, HttpServletRequest req,
			HttpServletResponse resp) throws Exception {

		HttpSession session = req.getSession(true);
		JsrpcEnvironment env = (JsrpcEnvironment)session.getAttribute(JSRPC_KEEP);

		if (env != null) {
			env.setHttpServletRequest(req);
			env.setHttpServletResponse(resp);
			return env;
		}


		Object obj = cls.newInstance();
		if (obj instanceof JsrpcEnvironment) {
			env = (JsrpcEnvironment)obj;
			env.setHttpServletRequest(req);
			env.setHttpServletResponse(resp);
		}
		return obj;
	}
	private void saveInstance(HttpServletRequest req, Object obj) {
		if (!(obj instanceof JsrpcEnvironment)) return;

		JsrpcEnvironment env = (JsrpcEnvironment)obj;
		if (!env.isSaveSession()) return;

		HttpSession session = req.getSession(true);
		session.setAttribute(JSRPC_KEEP, obj);
	}

	private void callMethodForMultiPart(HttpServletRequest req,
			HttpServletResponse resp) throws Exception {
		String pinfo = req.getPathInfo();
		int pos = pinfo.indexOf('.');
		String cname = pinfo.substring(1,pos).replace('/','.');
		String mname = pinfo.substring(pos+1);

		MultiPartMap map = new MultiPartMap();
		FileItemIterator ite = new FileUpload().getItemIterator(req);
		while (ite.hasNext()) {
			FileItemStream item = ite.next();
			if (item.isFormField()) {
				map.put(item.getFieldName(),
						IOUtil.streamToString(item.openStream(),"UTF-8"));
			} else {
				FileItem val = new FileItem(item.getFileName(),
						item.getContentType(),
						IOUtil.streamToBytes(item.openStream()));
				map.put(item.getFieldName(), val);
			}
		}

		Class clazz = Class.forName(cname);
		Class[] types = new Class[]{MultiPartMap.class};
		Method method = clazz.getMethod(mname, types);
		if (method == null) {
			throw new RuntimeException(
					"Not found method "+mname+"(Map)");
		}

		Object obj = getInstance(clazz, req, resp);
		Object result = method.invoke(obj, map);
		saveInstance(req, obj);

		resp.setContentType(MIME_HTML+";charset=utf-8");
		resp.getWriter().write(result.toString());
	}

	private void callMethodForParam(HttpServletRequest req,
			HttpServletResponse resp) throws Exception {
		String pinfo = req.getPathInfo();
		int pos = pinfo.indexOf('.');
		String cname = pinfo.substring(1,pos).replace('/','.');
		String mname = pinfo.substring(pos+1);

		int argc = 0;
		while (req.getParameter("a"+argc) != null) argc++;

		Class clazz = Class.forName(cname);
		Method method = null;
		Method[] methods = clazz.getMethods();
		for (int i=0; i<methods.length; i++) {
			if (methods[i].getParameterTypes().length == argc
				&& mname.equals(methods[i].getName())) {
				method = methods[i];
			}
		}
		if (method == null) {
			throw new RuntimeException(
					"Not found method "+mname+"("+argc+"args)");
		}


		Object[] args = new Object[argc];
		Class[] types = method.getParameterTypes();
		if (types != null) {
			for (int i=0; i<types.length; i++) {
				args[i] = toArg(types[i], req.getParameter("a"+i));
			}
		}

		Object obj = getInstance(clazz, req, resp);
		Object result = method.invoke(obj, args);
		saveInstance(req, obj);

		resp.setContentType(MIME_JSON);
		OutputStream out = resp.getOutputStream();
		out.write("{\"result\":".getBytes("UTF-8"));
		new JSONSerializer().serialize(result, out);
		out.write("}".getBytes("UTF-8"));
		out.flush();
	}
	private void callJsonRpc(HttpServletRequest req, HttpServletResponse resp) throws Exception {
		JSONParser parser = new JSONParser();
		Map map = parser.parse(req.getReader());
		String mname = map.get("method").toString();
		List params = (List) map.get("params");
		int argc = params.size();

		String pinfo = req.getPathInfo();
		String cname = pinfo.substring(1).replace('/','.');

		Class clazz = Class.forName(cname);
		Method method = null;
		Method[] methods = clazz.getMethods();
		for (int i=0; i<methods.length; i++) {
			if (methods[i].getParameterTypes().length == argc
				&& mname.equals(methods[i].getName())) {
				method = methods[i];
			}
		}
		if (method == null) {
			throw new RuntimeException(
					"Not found method "+mname+"("+argc+"args)");
		}


		Object[] args = new Object[argc];
		Class[] types = method.getParameterTypes();
		if (types != null) {
			for (int i=0; i<types.length; i++) {
				args[i] = params.get(i);
			}
		}

		resp.setHeader("Pragma","no-cache");
		resp.setHeader("Cache-Control","no-cache");

		Object obj = getInstance(clazz, req, resp);
		Object result = method.invoke(obj, args);
		saveInstance(req, obj);

		if (resp.isCommitted()) return;

		OutputStream out = resp.getOutputStream();
		resp.setContentType(MIME_JSON);
		out.write("{\"result\":".getBytes("UTF-8"));
		new JSONSerializer().serialize(result, out);
		out.write("}".getBytes("UTF-8"));
		out.flush();

	}

	private Object toArg(Class type, String val) throws Exception {
		if (type == String.class) {
			return val;
		} else if (type == int.class) {
			return Integer.parseInt(val);
		} else if (type == long.class) {
			return Long.parseLong(val);
		} else if (type == short.class) {
			return Short.parseShort(val);
		} else if (type == boolean.class) {
			return Boolean.parseBoolean(val);
		} else if (type == double.class) {
			return Double.parseDouble(val);
		} else if (type == float.class) {
			return Float.parseFloat(val);
		} else if (type == java.util.Map.class) {
			return new JSONParser().parse(val);
		} else if (type == java.util.List.class) {
			return new JSONParser().parseArray(val);
		}
		throw new RuntimeException("Unsupported type "+type.getName());
	}

}
