package org.kotemaru.jsrpc;

import java.util.HashMap;

import org.slim3.controller.upload.FileItem;

public class MultiPartMap extends HashMap<String,Object> {

	public MultiPartMap() {
		super();
	}

	public String toString(String key) {
		Object val = super.get(key);
		if (val == null) return null;
		return val.toString();
	}
	public String toStringNull(String key) {
		Object val = super.get(key);
		if (val == null) return null;
		String str = val.toString().trim();
		if (str.length() == 0) return null;
		return str;
	}
	public Double toDouble(String key) {
		String val = toStringNull(key);
		if (val == null) return null;
		return Double.parseDouble(val);
	}
	public Integer toInteger(String key) {
		String val = toStringNull(key);
		if (val == null) return null;
		return Integer.parseInt(val);
	}
	public Long toLong(String key) {
		String val = toStringNull(key);
		if (val == null) return null;
		return Long.parseLong(val);
	}

	
	public FileItem toFileItem(String key) {
		Object val = super.get(key);
		if (val == null) return null;
		return (FileItem) val;
	}
	
}
