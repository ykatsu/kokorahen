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

	private String googleUser;
	private String twitterUser;
	private String nickname;
	private String photoUrl;
	private String comment;

	private Date createDate;
	private Date updateDate;
	private Date lastLogin;

	private boolean autoTwit = false;
	private List<Long> follows = null;

	@Attribute(persistent = false)
	private String provider;
	@Attribute(persistent = false)
	private Map<Long,String> followsNickname = null;

	public Long getUserId() {
		return getKey().getId();
	}
	public void setUserId(Long id) {
		throw new RuntimeException("Unsuported.");
	}
	
	public String getGoogleUser() {
		return googleUser;
	}

	public void setGoogleUser(String googleUser) {
		this.googleUser = googleUser;
	}

	public String getTwitterUser() {
		return twitterUser;
	}

	public void setTwitterUser(String twitterUser) {
		this.twitterUser = twitterUser;
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


	public List<Long> getFollows() {
		return follows;
	}

	public void setFollows(List<Long> follows) {
		this.follows = follows;
	}


	public Map<Long, String> getFollowsNickname() {
		return followsNickname;
	}

	public void setFollowsNickname(Map<Long, String> followsNickname) {
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
