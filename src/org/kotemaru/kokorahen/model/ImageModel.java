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
public class ImageModel extends ModelBase {
    private static final long serialVersionUID = 1L;

	private Long userId;
	private String fileName;
	@Attribute(persistent=false)
	private String contentType = "image/jpeg"; // 固定
	private Date createDate;
	private String originUrl;

	@Attribute(lob=true)
	private byte[] data;
	
	public long getId() {
		return getKey().getId();
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getFileName() {
		return fileName;
	}

	public void setFileName(String fileName) {
		this.fileName = fileName;
	}

	public String getContentType() {
		return contentType;
	}

	public void setContentType(String contentType) {
		this.contentType = contentType;
	}

	public byte[] getData() {
		return data;
	}

	public void setData(byte[] data) {
		this.data = data;
	}

	public Date getCreateDate() {
		return createDate;
	}

	public void setCreateDate(Date createDate) {
		this.createDate = createDate;
	}

	public String getOriginUrl() {
		return originUrl;
	}

	public void setOriginUrl(String originUrl) {
		this.originUrl = originUrl;
	}


	
}
