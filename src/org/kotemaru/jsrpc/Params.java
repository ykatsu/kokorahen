package org.kotemaru.jsrpc;

import java.util.Map;

public class Params  {
	private Map map;

	public Params(Map map) {
		this.map = map;
	}
	public Object get(String key) {
		return map.get(key);
	}

	public String toString(String key) {
		return (String) map.get(key);
	}
	public Double toDouble(String key) {
		Object val = map.get(key);
		if (val == null) return null;
		if (val instanceof Double) return (Double) val;
		String strVal = val.toString();
		if (strVal.length() == 0) return null;
		return Double.valueOf(strVal);
	}
	public Integer toInteger(String key) {
		Object val = map.get(key);
		if (val == null) return null;
		if (val instanceof Integer) return (Integer) val;
		String strVal = val.toString();
		if (strVal.length() == 0) return null;
		return Integer.valueOf(strVal);
	}
	public Long toLong(String key) {
		Object val = map.get(key);
		if (val == null) return null;
		if (val instanceof Long) return (Long) val;
		String strVal = val.toString();
		if (strVal.length() == 0) return null;
		return Long.valueOf(strVal);
	}
	public Boolean toBoolean(String key) {
		return (Boolean) map.get(key);
	}

	public Float toFloat(String key) {
		Object val = map.get(key);
		if (val == null) return null;
		if (val instanceof Float) return (Float)val;
		String strVal = val.toString();
		if (strVal.length() == 0) return null;
		return Float.valueOf(strVal);
	}
	public String toString() {
		return map.toString();
	}

}
