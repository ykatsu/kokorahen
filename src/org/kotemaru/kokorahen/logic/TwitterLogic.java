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
import twitter4j.Twitter;
import twitter4j.TwitterFactory;
import twitter4j.User;
import twitter4j.auth.RequestToken;

public class TwitterLogic implements java.io.Serializable {
	private static final long serialVersionUID = 1L;
	private static final Logger LOG = Logger.getLogger(TwitterLogic.class.getName());

	private Kokorahen env;
	private Twitter twitter;
	private RequestToken twitterRequestToken;

	private TwitterLogic(Kokorahen env) {
		this.env = env;
	}
	
	public static TwitterLogic getInstance(Kokorahen env) {
		return new TwitterLogic(env);
	}

	public String login(String callback) throws TwitterException {
		if (twitter == null) {
			twitter = new TwitterFactory().getInstance();
		}
		twitterRequestToken = twitter.getOAuthRequestToken(callback);
		return twitterRequestToken.getAuthenticationURL();
	}
	
	public boolean verify(String verifier) throws TwitterException {
		if (twitter==null || twitterRequestToken==null || verifier == null) {
			return false;
		}
		twitter.getOAuthAccessToken(twitterRequestToken, verifier);
		return true;
	}
	
	public String getScreenName() throws TwitterException {
		return twitter.getScreenName();
	}
	public twitter4j.User getTwitterUser() throws TwitterException {
		return twitter.showUser(twitter.getId());
	}
	
	public void twit(String msg) throws Exception {
		if (twitter == null) {
			LOG.warning("not twit");
			return;
		}
		twitter4j.Status stat = twitter.updateStatus(msg);
	}

}
