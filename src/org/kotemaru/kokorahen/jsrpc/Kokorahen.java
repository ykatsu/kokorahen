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
import org.kotemaru.jsrpc.MultiPartMap;
import org.kotemaru.jsrpc.Params;
import org.kotemaru.jsrpc.annotation.JsRpc;
import org.kotemaru.kokorahen.meta.MemoModelMeta;
import org.kotemaru.kokorahen.meta.ReviewModelMeta;
import org.kotemaru.kokorahen.meta.SpotModelMeta;
import org.kotemaru.kokorahen.model.MemoModel;
import org.kotemaru.kokorahen.model.ReviewModel;
import org.kotemaru.kokorahen.model.SpotModel;
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

	private static final String  PROVIDER = "provider";
	private static final String  USERNAME = "username";
	private static final String  NICKNAME = "nickname";
	private static final String  LOGIN_URL = "LoginUrl";
	private static final String  LOGOUT_URL = "LogoutUrl";

	private static final String  GOOGLE = "google";
	private static final String  TWITTER = "twitter";

	private static final String  LOGOUT_PATH =
"/classes/org/kotemaru/kokorahen/jsrpc/Kokorahen.logout";

	public static Map getLoginInfo(String url) throws Exception {
		//Params params = new Params(map);

		HttpRequestContext ctx = CalljavaServlet.getHttpRequestContext();
		HttpServletRequest req = ctx.getRequest();
		HttpSession session = req.getSession(true);
		LOG.warning("getLoginInfo="+session.getId());

		Map info = (Map) session.getAttribute(LOGIN_INFO);
		if (info == null) {
			info = new HashMap();
		}
		LOG.warning("getLoginInfo="+info);

		setupGoogle(info, url);
		setupTwitter(info, url, session);
		session.setAttribute(LOGIN_INFO, info);
		return info;
	}
	private static void setupGoogle(Map info, String url) throws Exception {
		if (info.get(PROVIDER) != null) return;

		UserService us = UserServiceFactory.getUserService();
		if (us.getCurrentUser() != null) {
			info.put(PROVIDER, GOOGLE);
			info.put(USERNAME, us.getCurrentUser().getEmail());
			info.put(NICKNAME, us.getCurrentUser().getNickname());
		}
		info.put(GOOGLE+LOGIN_URL, us.createLoginURL(url));
		info.put(GOOGLE+LOGOUT_URL, us.createLogoutURL(url+LOGOUT_PATH));
	}
	private static void setupTwitter(Map info, String url, HttpSession session) throws Exception {
		if (info.get(PROVIDER) != null) return;

		Twitter twitter = (Twitter) session.getAttribute(TWITTER);
		if (twitter == null) {
			twitter = new TwitterFactory().getInstance();
			//twitter.setOAuthConsumer();->appengine-web.xml
			session.setAttribute(TWITTER, twitter);
			String callback =
"https://ichimemo.appspot.com/classes/org/kotemaru/kokorahen/jsrpc/Kokorahen.twitterCallback";
			RequestToken requestToken = twitter.getOAuthRequestToken(callback);
			session.setAttribute("twitter.requestToken", requestToken);
			info.put(TWITTER+LOGIN_URL, requestToken.getAuthenticationURL());
			info.put(TWITTER+LOGOUT_URL, url+LOGOUT_PATH);
		}
	}

	public static void twitterCallback() throws Exception {
		HttpRequestContext ctx = CalljavaServlet.getHttpRequestContext();
		HttpServletRequest req = ctx.getRequest();
		HttpServletResponse res= ctx.getResponse();
		HttpSession session = req.getSession();

		Twitter twitter = (Twitter) session.getAttribute(TWITTER);
		RequestToken requestToken = (RequestToken) session.getAttribute("twitter.requestToken");
		String verifier = req.getParameter("oauth_verifier");
		if (twitter==null || requestToken==null || verifier == null) {
			LOG.warning("Not twitter login");
			session.invalidate();
			res.sendRedirect("/");
			return;
		}

		twitter.getOAuthAccessToken(requestToken, verifier);
		Map info = (Map) session.getAttribute(LOGIN_INFO);
		info.put(PROVIDER, TWITTER);
		info.put(USERNAME, ""+twitter.getId()+"@twitter.com");
		info.put(NICKNAME, twitter.getScreenName());
		//info.put("googleLogoutUrl", us.createLogoutURL(url));
		session.setAttribute(LOGIN_INFO, info);
		LOG.warning("callback="+session.getId());
		//return info;
		res.sendRedirect("/");
	}

	public static void logout() throws Exception {
		logout("/");
	}
	public static void logout(String nextUrl) throws Exception {
		HttpRequestContext ctx = CalljavaServlet.getHttpRequestContext();
		HttpServletRequest req = ctx.getRequest();
		HttpServletResponse res= ctx.getResponse();
		HttpSession session = req.getSession();

		session.invalidate();
		res.sendRedirect(nextUrl);
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

		model.setUsername(null); // TODO:
		model.setSpotId(params.getLong("spotId")); // TODO:
		model.setCreateDate(new Date());
		model.setUpdateDate(new Date());
		model.setAppraise(params.getInteger("appraise"));
		model.setComment(params.getString("comment"));
		Key key = Datastore.put(model);

		twit(params.getString("comment"));

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
