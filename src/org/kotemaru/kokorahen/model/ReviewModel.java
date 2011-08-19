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
public class ReviewModel extends ModelBase {
	private static final long serialVersionUID = 1L;

	private String username;
	private Long spotId;
	private Date createDate;
	private Date updateDate;
	private String comment;
	private Integer appraise = -1;

	public long getId() {
		return getKey().getId();
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public Long getSpotId() {
		return spotId;
	}

	public void setSpotId(Long spotId) {
		this.spotId = spotId;
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

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}

	public Integer getAppraise() {
		return appraise;
	}

	public void setAppraise(Integer appraise) {
		this.appraise = appraise;
	}

}