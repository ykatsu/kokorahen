package org.kotemaru.kokorahen.model;

import java.io.Serializable;
import java.util.Collection;
import java.util.Date;
import java.util.List;

import org.slim3.datastore.Attribute;
import org.slim3.datastore.InverseModelRef;
import org.slim3.datastore.Model;

import com.google.appengine.api.datastore.Key;

@Model
public class SpotModel extends ModelBase {
	private static final long serialVersionUID = 1L;

	private String name;
	private Date createDate;
	private Date updateDate;
	private Double lat;
	private Double lng;
	private String area;
	private String address;
	private List<String> tags;
	private Integer level = 0;
	private Integer appraise = -1;
	private String image;
	private String comment;
	private String openHours;
	private String closedDay;


	public long getId() {
		return getKey().getId();
	}


	public String getName() {
		return name;
	}


	public void setName(String name) {
		this.name = name;
	}


	public Date getCreateDate() {
		return createDate;
	}


	public void setCreateDate(Date createDate) {
		this.createDate = createDate;
	}


	public Date getUpdateDate() {
		return updateDate;
	}


	public void setUpdateDate(Date updateDate) {
		this.updateDate = updateDate;
	}


	public Double getLat() {
		return lat;
	}


	public void setLat(Double lat) {
		this.lat = lat;
	}


	public Double getLng() {
		return lng;
	}


	public void setLng(Double lng) {
		this.lng = lng;
	}


	public String getArea() {
		return area;
	}


	public void setArea(String area) {
		this.area = area;
	}


	public String getAddress() {
		return address;
	}


	public void setAddress(String address) {
		this.address = address;
	}


	public List<String> getTags() {
		return tags;
	}


	public void setTags(List<String> tags) {
		this.tags = tags;
	}


	public Integer getLevel() {
		return level;
	}


	public void setLevel(Integer level) {
		this.level = level;
	}


	public Integer getAppraise() {
		return appraise;
	}


	public void setAppraise(Integer appraise) {
		this.appraise = appraise;
	}


	public String getImage() {
		return image;
	}


	public void setImage(String image) {
		this.image = image;
	}


	public String getComment() {
		return comment;
	}


	public void setComment(String comment) {
		this.comment = comment;
	}


	public String getOpenHours() {
		return openHours;
	}


	public void setOpenHours(String openHours) {
		this.openHours = openHours;
	}


	public String getClosedDay() {
		return closedDay;
	}


	public void setClosedDay(String closedDay) {
		this.closedDay = closedDay;
	}



}
