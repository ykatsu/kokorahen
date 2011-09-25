package org.kotemaru.kokorahen.servlet;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.*;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.*;

import org.kotemaru.kokorahen.model.ImageModel;
import org.kotemaru.util.IOUtil;
import org.kotemaru.util.json.JSONParser;
import org.kotemaru.util.json.JSONSerializer;
import org.slim3.datastore.Datastore;
import org.slim3.datastore.EntityNotFoundRuntimeException;

import com.google.appengine.api.datastore.Key;

@SuppressWarnings("serial")
public class ImageServlet extends HttpServlet {
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {

		String id = req.getParameter("id");
		if (id == null) return;

		Key key = Datastore.createKey(ImageModel.class, Long.valueOf(id));
		ImageModel model;
		try {
			model = Datastore.get(ImageModel.class, key);
		} catch (EntityNotFoundRuntimeException e) {
			resp.setStatus(404);
			return;
		}
		byte[] data = model.getData();
		resp.setContentType(model.getContentType());
		resp.setContentLength(data.length);
		resp.setHeader("Cache-Control", "public");
	
		resp.getOutputStream().write(data);
		resp.getOutputStream().flush();
	}
}	