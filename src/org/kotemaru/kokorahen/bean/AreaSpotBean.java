package org.kotemaru.kokorahen.bean;

import java.util.List;

import org.kotemaru.kokorahen.model.SpotModel;

public class AreaSpotBean {
	private String area;
	private List<SpotModel> spots;

	public AreaSpotBean(String area, List<SpotModel> spots) {
		this.area = area;
		this.spots = spots;
	}
	public String getArea() {
		return area;
	}
	public void setArea(String area) {
		this.area = area;
	}
	public List<SpotModel> getSpots() {
		return spots;
	}
	public void setSpots(List<SpotModel> spots) {
		this.spots = spots;
	}
	
	
}
