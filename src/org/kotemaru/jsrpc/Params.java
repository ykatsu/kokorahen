package org.kotemaru.jsrpc;

import java.util.Map;

public class Params  {
	private Map map;

	public Params(Map map) {
		this.map = map;
	}

	public String getString(String key) {
		return (String) map.get(key);
	}
	public Double getDouble(String key) {
		Object val = map.get(key);
		if (val == null) return null;
		if (val instanceof Double) return (Double) val;
		String strVal = val.toString();
		if (strVal.length() == 0) return null;
		return Double.valueOf(strVal);
	}
	public Integer getInteger(String key) {
		Object val = map.get(key);
		if (val == null) return null;
		if (val instanceof Integer) return (Integer) val;
		String strVal = val.toString();
		if (strVal.length() == 0) return null;
		return Integer.valueOf(strVal);
	}
	public Long getLong(String key) {
		Object val = map.get(key);
		if (val == null) return null;
		if (val instanceof Long) return (Long) val;
		String strVal = val.toString();
		if (strVal.length() == 0) return null;
		return Long.valueOf(strVal);
	}
	public Boolean getBoolean(String key) {
		return (Boolean) map.get(key);
	}

}
