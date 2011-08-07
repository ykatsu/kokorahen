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
		return (Double) map.get(key);
	}
	public Integer getInteger(String key) {
		return (Integer) map.get(key);
	}
	public Long getLong(String key) {
		return (Long) map.get(key);
	}
	public Boolean getBoolean(String key) {
		return (Boolean) map.get(key);
	}

}
