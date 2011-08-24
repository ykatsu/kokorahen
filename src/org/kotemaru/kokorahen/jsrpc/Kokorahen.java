package org.kotemaru.kokorahen.jsrpc;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slim3.controller.upload.FileItem;
import org.slim3.datastore.*;

import org.kotemaru.ichimemo.model.*;
import org.kotemaru.ichimemo.meta.*;
import org.kotemaru.jsrpc.CalljavaServlet;
import org.kotemaru.jsrpc.JsrpcException;
import org.kotemaru.jsrpc.MultiPartMap;
import org.kotemaru.jsrpc.Params;
import org.kotemaru.jsrpc.annotation.JsRpc;
import org.kotemaru.kokorahen.meta.MemoModelMeta;
import org.kotemaru.kokorahen.meta.ReviewModelMeta;
import org.kotemaru.kokorahen.meta.SpotModelMeta;
import org.kotemaru.kokorahen.model.MemoModel;
import org.kotemaru.kokorahen.model.ReviewModel;
import org.kotemaru.kokorahen.model.SpotModel;
import org.kotemaru.kokorahen.model.UserModel;
import org.kotemaru.util.HttpRequestContext;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import twitter4j.Twitter;
import twitter4j.TwitterException;
import twitter4j.TwitterFactory;
import twitter4j.auth.RequestToken;

@JsRpc()
public class Kokorahen {
	private static final Logger LOG = Logger.getLogger(Kokorahen.class.getName());

	private static final String  LOGIN_INFO = "Login.info";
	private static final String  LOGIN_USER = "Login.user";

	private static final String  PROVIDER = "provider";
	private static final String  USERNAME = "username";
	private static final String  NICKNAME = "nickname";
	private static final String  LOGIN_URL = "LoginUrl";
	private static final String  LOGOUT_URL = "LogoutUrl";

	private static final String  GOOGLE = "google";
	private static final String  TWITTER = "twitter";
	private static final String  TWITTER_TOKEN = "twitter.requestToken";

	private static final String  LOGOUT_PATH =
"/classes/org/kotemaru/kokorahen/jsrpc/Kokorahen.logout";

	private static HttpSession getSession(boolean b) {
		return CalljavaServlet.getHttpRequestContext().getSession(b);
	}
	private static void redirect(String url) throws IOException {
		HttpServletResponse res = CalljavaServlet.getHttpRequestContext().getResponse();
		res.sendRedirect(url);
	}

	public static UserModel getLoginUser() {
		HttpSession session = getSession(true);
		System.out.println("getLogin="+session.getId());
		UserModel user = (UserModel) session.getAttribute(LOGIN_USER);
		return user;
	}


	public static String login(String provider) throws Exception {
		HttpServletRequest req = CalljavaServlet.getHttpRequestContext().getRequest();
		String url = req.getScheme()+"://"+req.getServerName()+":"+req.getServerPort();
		if (GOOGLE.equals(provider)) {
			return loginGoogle(url);
		} else if (TWITTER.equals(provider)) {
			return loginTwitter(url);
		} else {
			throw new RuntimeException("Unsupported login provider "+provider);
		}
		// TODO:lastLogin
	}


	public static String loginGoogle(String url) throws Exception {
		HttpSession session = getSession(true);

		UserService us = UserServiceFactory.getUserService();
		if (us.getCurrentUser() != null) {
			String name = us.getCurrentUser().getEmail();
			Key key = Datastore.createKey(UserModel.class, name);
			UserModel user;
			try {
				user = Datastore.get(UserModel.class, key);
			} catch (EntityNotFoundRuntimeException e) {
				user = new UserModel();
				user.setUsername(name);
				user.setNickname(name);
				user.setProvider(GOOGLE);
				user.setCreateDate(new Date());
				user.setUpdateDate(new Date());
				user.setLastLogin(new Date());
			}
			user.setLastLogin(new Date());
			Datastore.put(user);

			session.setAttribute(LOGIN_USER, user);
			return "/";
		}

		String callback = url+ "/classes/org/kotemaru/kokorahen/jsrpc/Kokorahen.googleCallback";
		return us.createLoginURL(callback);
	}
	public static void googleCallback() throws Exception {
		redirect(login(GOOGLE));
	}

	private static String loginTwitter(String url) throws Exception {
		HttpSession session = getSession(true);

		Twitter twitter = (Twitter) session.getAttribute(TWITTER);
		if (twitter == null) {
			twitter = new TwitterFactory().getInstance();
			//twitter.setOAuthConsumer();->appengine-web.xml
			session.setAttribute(TWITTER, twitter);
		}
		String callback = url+ "/classes/org/kotemaru/kokorahen/jsrpc/Kokorahen.twitterCallback";
		RequestToken requestToken = twitter.getOAuthRequestToken(callback);
		session.setAttribute(TWITTER_TOKEN, requestToken);
		return requestToken.getAuthenticationURL();
	}

	public static void twitterCallback() throws Exception {
		HttpRequestContext ctx = CalljavaServlet.getHttpRequestContext();
		HttpServletRequest req = ctx.getRequest();
		//HttpServletResponse res= ctx.getResponse();
		//HttpSession session = req.getSession();
		HttpSession session = getSession(true);

		Twitter twitter = (Twitter) session.getAttribute(TWITTER);
		RequestToken requestToken = (RequestToken) session.getAttribute(TWITTER_TOKEN);
		String verifier = req.getParameter("oauth_verifier");
		if (twitter==null || requestToken==null || verifier == null) {
			LOG.warning("Not twitter login");
			session.invalidate();
			redirect("/");
			return;
		}

		twitter.getOAuthAccessToken(requestToken, verifier);

		String name = "@"+twitter.getScreenName();
		Key key = Datastore.createKey(UserModel.class, name);
		UserModel user;
		try {
			user = Datastore.get(UserModel.class, key);
		} catch (EntityNotFoundRuntimeException e) {
			user = new UserModel();
			user.setUsername(name);
			user.setNickname(twitter.showUser(twitter.getId()).getName());
			user.setProvider(TWITTER);
			user.setCreateDate(new Date());
			user.setUpdateDate(new Date());
			user.setAutoTwit(true);
		}
		user.setLastLogin(new Date());
		Datastore.put(user);
		session.setAttribute(LOGIN_USER, user);
		redirect("/");
		return;
	}

	public static String logout(String provider) throws Exception {
		HttpServletRequest req = CalljavaServlet.getHttpRequestContext().getRequest();
		String url = req.getScheme()+"://"+req.getServerName()+":"+req.getServerPort();

		HttpSession session = getSession(true);
		session.invalidate();

		if (GOOGLE.equals(provider)) {
			return logoutGoogle(url);
		} else if (TWITTER.equals(provider)) {
			return logoutTwitter(url);
		} else {
			//throw new RuntimeException("Unsupported login provider "+provider);
			return url;
		}
	}

	private static String logoutGoogle(String url) throws Exception {
		HttpSession session = getSession(true);

		session.invalidate();
		UserService us = UserServiceFactory.getUserService();
		return us.createLogoutURL(url);
	}
	private static String logoutTwitter(String url) throws Exception {
		return url;
	}


	private static void twit(String msg) throws Exception {
		HttpRequestContext ctx = CalljavaServlet.getHttpRequestContext();
		HttpSession session = ctx.getSession(false);
		Twitter twitter = (Twitter) session.getAttribute(TWITTER);
		if (twitter == null) {
			LOG.warning("not twit sid="+session.getId());
			return;
		}

		twitter4j.Status stat = twitter.updateStatus(msg);
		LOG.warning("twit sid="+session.getId()+","+stat.getText());
	}

	public static String writeImage(MultiPartMap params) {
		FileItem fileItem = params.getFileItem("file");
		if (fileItem == null || fileItem.getData().length == 0) {
			return "";
		}

		ImageModel img = new ImageModel();
		img.setContentType(fileItem.getContentType());
		img.setFileName(fileItem.getFileName());
		img.setData(fileItem.getData());
		Key imgKey = Datastore.put(img);
		return ""+imgKey.getId();
	}

	public static Long writeSpot(Map map) {
		Params params = new Params(map);
System.out.println("--->"+map);
		//String imgKey = writeImage(params);

		SpotModel model = null;
		Long id = params.getLong("id");
		if (id != null) {
			Key key = Datastore.createKey(SpotModel.class, id);
			model = Datastore.get(SpotModel.class, key);
		} else {
			model = new SpotModel();
		}

		model.setName(params.getString("name"));
		model.setCreateDate(new Date());
		model.setUpdateDate(new Date());
		model.setLat(params.getDouble("lat"));
		model.setLng(params.getDouble("lng"));
		model.setArea(toArea(model.getLat(), model.getLng()));
		model.setAddress(params.getString("address"));
		//model.setAppraise(params.getInteger("appraise"));
		model.setTags(Arrays.asList(params.getString("tags").split(",")));
		model.setImage(params.getString("image"));
		model.setComment(params.getString("comment"));
		model.setClosedDay(params.getString("closedDay"));
		model.setOpenHours(params.getString("openHours"));
		model.setEmail(params.getString("email"));
		model.setUrl(params.getString("url"));
		//model.setImage(imgKey);
		Key key = Datastore.put(model);

		return key.getId();
	}


	public static Long writeMemo(Map map) {
		Params params = new Params(map);

		MemoModel model = null;
		Long id = params.getLong("id");
		if (id != null) {
			Key key = Datastore.createKey(MemoModel.class, id);
			model = Datastore.get(MemoModel.class, key);
		} else {
			model = new MemoModel();
		}

		List<String> images = new ArrayList<String>(1);
		images.add(params.getString("image"));

		model.setUsername(null); // TODO:
		model.setCreateDate(new Date());
		model.setUpdateDate(new Date());
		model.setLat(params.getDouble("lat"));
		model.setLng(params.getDouble("lng"));
		model.setArea(toArea(model.getLat(), model.getLng()));
		model.setAddress(params.getString("address"));
		model.setAppraise(params.getInteger("appraise"));
		model.setTags(Arrays.asList(params.getString("tags").split(",")));
		model.setComment(params.getString("comment"));
		model.setImages(images);
		model.setPublish(params.getBoolean("publish"));
		model.setTested(params.getBoolean("tested"));
		Key key = Datastore.put(model);

		return key.getId();

	}
	public static Long writeReview(Map map) throws Exception {
		UserModel user = getLoginUser();
		if (user == null) {
			throw new JsrpcException("Not loggedin.");
		}
		Params params = new Params(map);

		ReviewModel model = null;
		Long id = params.getLong("id");
		if (id != null) {
			Key key = Datastore.createKey(ReviewModel.class, id);
			model = Datastore.get(ReviewModel.class, key);
		} else {
			model = new ReviewModel();
		}

		List<String> images = new ArrayList<String>(1);
		images.add(params.getString("image"));

		model.setUsername(user.getUsername());
		model.setNickname(user.getNickname());
		model.setSpotId(params.getLong("spotId"));
		model.setCreateDate(new Date());
		model.setUpdateDate(new Date());
		model.setAppraise(params.getInteger("appraise"));
		model.setComment(params.getString("comment"));
		Key key = Datastore.put(model);

		twit(params.getString("comment")+"@"+params.getString("name"));

		return key.getId();
	}


	private static String toArea(double lat, double lng) {
		// Note:日本列島ではざっくり１度=100Kmで考える。
		System.out.println("->"+lat+","+lng);
		lat = Math.floor(lat*100)/100;
		lng = Math.floor(lng*100)/100;
		String area = String.format("%06.2f,%06.2f", lat, lng); // TODO:マイナス
//System.out.println("area="+area+":"+lat+","+lng);
		return area;
	}



	public static ImageModel getImage(long id) {
		try {
			Key key = Datastore.createKey(ImageModel.class, id);
			ImageModel model = Datastore.get(ImageModel.class, key);
			return model;
		} catch (EntityNotFoundRuntimeException e) {
			return null;
		}
	}

	public static List<String> getAreas(Map params){
		double minLat = (Double) params.get("minLat");
		double minLng = (Double) params.get("minLng");
		double maxLat = (Double) params.get("maxLat");
		double maxLng = (Double) params.get("maxLng");

		List<String> list = new ArrayList<String>();
		for (double lat = minLat; lat<maxLat; lat += 0.01) {
			for (double lng = minLng; lng<maxLng; lng += 0.01) {
				list.add(toArea(lat,lng));
			}
		}
		// TODO:センターに近い順にソートはクライアントでやるべき？
		System.out.println("areas="+list+"\n"+params);
		return list;
	}


	public static List<SpotModel> listSpot(Map params){
		String area = (String) params.get("area");

		SpotModelMeta e = SpotModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.area.equal(area));
		List<SpotModel> list = q.asList();
		System.out.println("datas="+list+"\n"+params);
		return list;
	}

	public static List<MemoModel> listMemo(Map params){
		String area = (String) params.get("area");

		MemoModelMeta e = MemoModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.area.equal(area));
		List<MemoModel> list = q.asList();
		System.out.println("datas="+list+"\n"+params);
		return list;
	}
	public static List<ReviewModel> listReview(long spotId){
		ReviewModelMeta e = ReviewModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.spotId.equal(spotId));
		q.sort(e.updateDate.desc);
		q.limit(20);
		List<ReviewModel> list = q.asList();
		System.out.println("review="+list);
		return list;
	}
	public static List<ReviewModel> listTimeline(){
		ReviewModelMeta e = ReviewModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.sort(e.updateDate.desc);
		q.limit(20);
		List<ReviewModel> list = q.asList();
		System.out.println("review="+list);
		return list;
	}

}
