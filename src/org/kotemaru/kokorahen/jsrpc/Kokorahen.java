package org.kotemaru.kokorahen.jsrpc;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slim3.controller.upload.FileItem;
import org.slim3.datastore.*;

import org.kotemaru.ichimemo.model.ImageModel;
import org.kotemaru.jsrpc.JsrpcEnvironment;
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

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import twitter4j.Twitter;
import twitter4j.TwitterFactory;
import twitter4j.auth.RequestToken;

@JsRpc()
public class Kokorahen implements JsrpcEnvironment {
	private static final long serialVersionUID = 1L;

	private static final Logger LOG = Logger.getLogger(Kokorahen.class.getName());

	private static final String  GOOGLE = "google";
	private static final String  TWITTER = "twitter";

	private static final String BASE_PATH = "/classes/"
		+ Kokorahen.class.getName().replace('.','/');

	private transient HttpServletRequest request;
	private transient HttpServletResponse response;

	private UserModel loginUser;
	private Twitter twitter;
	private RequestToken twitterRequestToken;

	//-----------------------------------------------------------------------
	// for JsrpcEnviroment
	public void setHttpServletRequest(HttpServletRequest req) {
		this.request = req;
	}
	public void setHttpServletResponse(HttpServletResponse res) {
		this.response = res;
	}
	public boolean isSaveSession() {
		return true;
	}

	//-----------------------------------------------------------------------
	// コンビにメソッド
	private HttpSession getSession(boolean b) {
		return request.getSession(b);
	}
	private void redirect(String url) throws IOException {
		response.sendRedirect(url);
	}
	private String getServerUrl() throws IOException {
		String url = request.getScheme()+"://"
			+request.getServerName()+":"
			+request.getServerPort();
		return url;
	}

	//-----------------------------------------------------------------------
	// 公開メソッド

	public  UserModel getLoginUser() {
		return loginUser;
	}

	public  String login(String provider) throws Exception {
		String url = getServerUrl();
		if (GOOGLE.equals(provider)) {
			return loginGoogle(url);
		} else if (TWITTER.equals(provider)) {
			return loginTwitter(url);
		} else {
			throw new RuntimeException("Unsupported login provider "+provider);
		}
	}


	public  String loginGoogle(String url) throws Exception {
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

			this.loginUser = user;
			return "/";
		}

		String callback = url+ BASE_PATH+".googleCallback";
		return us.createLoginURL(callback);
	}
	public  void googleCallback() throws Exception {
		redirect(login(GOOGLE));
	}

	private  String loginTwitter(String url) throws Exception {
		if (twitter == null) {
			twitter = new TwitterFactory().getInstance();
		}
		String callback = url+ BASE_PATH+".twitterCallback";
		twitterRequestToken = twitter.getOAuthRequestToken(callback);
		return twitterRequestToken.getAuthenticationURL();
	}

	public  void twitterCallback() throws Exception {
		String verifier = request.getParameter("oauth_verifier");
		if (twitter==null || twitterRequestToken==null || verifier == null) {
			LOG.warning("Not twitter login");
			getSession(true).invalidate();
			redirect("/");
			return;
		}

		twitter.getOAuthAccessToken(twitterRequestToken, verifier);

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
		this.loginUser = user;
		redirect("/");
		return;
	}

	public  String logout(String provider) throws Exception {
		this.loginUser = null;
		getSession(true).invalidate();
System.out.println("logour:"+provider);
		String url = this.getServerUrl();
		if (GOOGLE.equals(provider)) {
			return logoutGoogle(url);
		} else if (TWITTER.equals(provider)) {
			return logoutTwitter(url);
		} else {
			//throw new RuntimeException("Unsupported login provider "+provider);
			return url;
		}
	}

	private  String logoutGoogle(String url) throws Exception {
		UserService us = UserServiceFactory.getUserService();
		return us.createLogoutURL(url);
	}
	private  String logoutTwitter(String url) throws Exception {
		return url;
	}


	private void twit(String msg) throws Exception {
		if (twitter == null) {
			LOG.warning("not twit");
			return;
		}
		twitter4j.Status stat = twitter.updateStatus(msg);
	}

	public  String writeImage(MultiPartMap params) {
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

	public  Long writeSpot(Map map) {
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


	public  Long writeMemo(Map map) {
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
	public  Long writeReview(Map map) throws Exception {
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


	private  String toArea(double lat, double lng) {
		// Note:日本列島ではざっくり１度=100Kmで考える。
		System.out.println("->"+lat+","+lng);
		lat = Math.floor(lat*100)/100;
		lng = Math.floor(lng*100)/100;
		String area = String.format("%06.2f,%06.2f", lat, lng); // TODO:マイナス
//System.out.println("area="+area+":"+lat+","+lng);
		return area;
	}



	public  ImageModel getImage(long id) {
		try {
			Key key = Datastore.createKey(ImageModel.class, id);
			ImageModel model = Datastore.get(ImageModel.class, key);
			return model;
		} catch (EntityNotFoundRuntimeException e) {
			return null;
		}
	}

	public  List<String> getAreas(Map params){
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


	public  List<SpotModel> listSpot(Map params){
		String area = (String) params.get("area");

		SpotModelMeta e = SpotModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.area.equal(area));
		List<SpotModel> list = q.asList();
		System.out.println("datas="+list+"\n"+params);
		return list;
	}

	public  List<MemoModel> listMemo(Map params){
		String area = (String) params.get("area");

		MemoModelMeta e = MemoModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.area.equal(area));
		List<MemoModel> list = q.asList();
		System.out.println("datas="+list+"\n"+params);
		return list;
	}
	public  List<ReviewModel> listReview(long spotId){
		ReviewModelMeta e = ReviewModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.spotId.equal(spotId));
		q.sort(e.updateDate.desc);
		q.limit(20);
		List<ReviewModel> list = q.asList();
		System.out.println("review="+list);
		return list;
	}
	public  List<ReviewModel> listTimeline(){
		ReviewModelMeta e = ReviewModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.sort(e.updateDate.desc);
		q.limit(20);
		List<ReviewModel> list = q.asList();
		System.out.println("review="+list);
		return list;
	}

}
