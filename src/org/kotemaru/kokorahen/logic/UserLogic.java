package org.kotemaru.kokorahen.logic;

import java.util.*;
import java.util.logging.Logger;
import org.slim3.datastore.*;
import org.kotemaru.jsrpc.Params;
import org.kotemaru.kokorahen.jsrpc.Kokorahen;
import org.kotemaru.kokorahen.meta.UserModelMeta;
import org.kotemaru.kokorahen.model.UserModel;

import twitter4j.TwitterException;

import com.google.appengine.api.datastore.Key;


public class UserLogic  {
	private static final long serialVersionUID = 1L;
	private static final Logger LOG = Logger.getLogger(UserLogic.class.getName());

	private Kokorahen env;
	private HashMap<Long,UserModel> cacheUserModel = new HashMap<Long,UserModel>();

	private UserLogic(Kokorahen env) {
		this.env = env;
	}
	
	
	public static UserLogic getInstance(Kokorahen env) {
		return new UserLogic(env);
	}

	public UserModel getUserModel(Long id) {
		UserModel user = cacheUserModel.get(id);
		if (user != null) return user;
		
		Key key = Datastore.createKey(UserModel.class, id);
		try {
			user = Datastore.get(UserModel.class, key);
			cacheUserModel.put(id, user);
			return user;
		} catch (EntityNotFoundRuntimeException e) {
			return null;
		}
	}
	public UserModel getGoogleUser(String name) {
		UserModelMeta e = UserModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.googleUser.equal(name));
		List<UserModel> list = q.asList();
		if (list.size() == 0) return null;
		return list.get(0);
	}
	public UserModel getTwitterUser(String name) {
		UserModelMeta e = UserModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.twitterUser.equal(name));
		List<UserModel> list = q.asList();
		if (list.size() == 0) return null;
		return list.get(0);
	}
	public UserModel getGoogleUser(String name, boolean isCreate) {
		UserModel user = getGoogleUser(name);
		if (user != null) return collectUserInfo(user);
		if (!isCreate) return null;
		
		user = new UserModel();
		user.setGoogleUser(name);
		user.setNickname(name);
		//user.setProvider(GOOGLE);
		user.setCreateDate(new Date());
		user.setUpdateDate(new Date());
		user.setLastLogin(new Date());
		Datastore.put(user);
		return collectUserInfo(user);
	}
	
	public UserModel getTwitterUser(String name, boolean isCreate) 
			throws IllegalStateException, TwitterException 
	{
		UserModel user = getTwitterUser(name);
		if (user != null) return collectUserInfo(user);
		if (!isCreate) return null;
		
		twitter4j.User tuser = env.twitterLogic.getTwitterUser();
			
		user = new UserModel();
		user.setTwitterUser(name);
		user.setNickname(tuser.getName());
		//user.setProvider(TWITTER);
		user.setPhotoUrl(tuser.getProfileImageURL().toExternalForm());
		user.setCreateDate(new Date());
		user.setUpdateDate(new Date());
		user.setAutoTwit(true);
		Datastore.put(user);
		return collectUserInfo(user);
	}

	public UserModel writeUser(Map map) throws Exception {
		Params params = new Params(map);
		Long id = params.toLong("userId");

		UserModel user =  getUserModel(id);
		user.setGoogleUser(params.toString("googleUser"));
		user.setTwitterUser(params.toString("twitterUser"));
		user.setNickname(params.toString("nickname"));
		user.setUpdateDate(new Date());
		user.setAutoTwit(params.toBoolean("autoTwit"));
		user.setFollows((List<Long>)params.get("follows"));
		user.setComment(params.toString("comment"));
		user.setPhotoUrl(params.toString("photoUrl"));

		Datastore.put(user);
		cacheUserModel.remove(id);
		return collectUserInfo(user);
	}
	public UserModel lastLogin(UserModel user) throws Exception {
		user.setLastLogin(new Date());
		Datastore.put(user);
		return user;
	}

	public UserModel collectUserInfo(UserModel user) {
		if (user.getFollows() == null) return user;
		
		Map <Long,String> nicknameMap = new HashMap<Long,String>();
		for (Long name : user.getFollows()) {
			Key key = Datastore.createKey(UserModel.class, name);
			try {
				UserModel u = Datastore.get(UserModel.class, key);
				nicknameMap.put(name, u.getNickname());
			} catch (EntityNotFoundRuntimeException e) {
				LOG.warning("Follow not exitst user:"+name);
			}
		}
		user.setFollowsNickname(nicknameMap);
		return user;
	}

}
