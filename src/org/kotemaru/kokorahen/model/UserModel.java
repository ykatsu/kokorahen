package org.kotemaru.kokorahen.model;

import java.io.Serializable;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;

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
	private String photoUrl;
	private String comment;

	private Date createDate;
	private Date updateDate;
	private Date lastLogin;

	private boolean autoTwit = false;
	private List<String> follows = null;

	@Attribute(persistent = false)
	private Map<String,String> followsNickname = null;

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

	public List<String> getFollows() {
		return follows;
	}

	public void setFollows(List<String> follows) {
		this.follows = follows;
	}

	public Map<String, String> getFollowsNickname() {
		return followsNickname;
	}

	public void setFollowsNickname(Map<String, String> followsNickname) {
		this.followsNickname = followsNickname;
	}

	public String getPhotoUrl() {
		return photoUrl;
	}

	public void setPhotoUrl(String photoUrl) {
		this.photoUrl = photoUrl;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}



}
