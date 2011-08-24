package org.kotemaru.kokorahen.model;

import java.io.Serializable;
import java.util.Collection;
import java.util.Date;
import java.util.List;

import org.slim3.datastore.Attribute;
import org.slim3.datastore.Datastore;
import org.slim3.datastore.InverseModelRef;
import org.slim3.datastore.Model;

import com.google.appengine.api.datastore.Key;

@Model
public class UserModel extends ModelBase {
	private static final long serialVersionUID = 1L;

	//private String username;
	private String nickname;
	private String provider;

	private Date createDate;
	private Date updateDate;
	private Date lastLogin;

	private boolean autoTwit = false;

	public String getUsername() {
		Key key = super.getKey();
		return key.getName();
	}

	public void setUsername(String username) {
		Key key = Datastore.createKey(UserModel.class, username);
		super.setKey(key);
	}

	public String getNickname() {
		return nickname;
	}

	public void setNickname(String nickname) {
		this.nickname = nickname;
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

	public boolean isAutoTwit() {
		return autoTwit;
	}

	public void setAutoTwit(boolean autoTwit) {
		this.autoTwit = autoTwit;
	}

	public String getProvider() {
		return provider;
	}

	public void setProvider(String provider) {
		this.provider = provider;
	}

	public Date getLastLogin() {
		return lastLogin;
	}

	public void setLastLogin(Date lastLogin) {
		this.lastLogin = lastLogin;
	}


}
