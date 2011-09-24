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

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slim3.controller.upload.FileItem;
import org.slim3.datastore.*;

import org.kotemaru.kokorahen.model.ImageModel;
import org.kotemaru.jsrpc.JsrpcEnvironment;
import org.kotemaru.jsrpc.JsrpcException;
import org.kotemaru.jsrpc.MultiPartMap;
import org.kotemaru.jsrpc.Params;
import org.kotemaru.jsrpc.annotation.JsRpc;
import org.kotemaru.kokorahen.bean.AreaSpotBean;
import org.kotemaru.kokorahen.logic.ImageLogic;
import org.kotemaru.kokorahen.logic.KakasiLogic;
import org.kotemaru.kokorahen.meta.ImageModelMeta;
import org.kotemaru.kokorahen.meta.MemoModelMeta;
import org.kotemaru.kokorahen.meta.ReviewModelMeta;
import org.kotemaru.kokorahen.meta.SpotModelMeta;
import org.kotemaru.kokorahen.meta.UserModelMeta;
import org.kotemaru.kokorahen.model.MemoModel;
import org.kotemaru.kokorahen.model.ReviewModel;
import org.kotemaru.kokorahen.model.SpotModel;
import org.kotemaru.kokorahen.model.UserModel;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import twitter4j.Twitter;
import twitter4j.TwitterFactory;
import twitter4j.User;
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
System.out.println("getLoginUser:"+loginUser+":"+getSession(false).getId());
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
			UserModel user = getGoogleUser(name);
			if (user == null) {
				user = new UserModel();
				user.setGoogleUser(name);
				user.setNickname(name);
				user.setProvider(GOOGLE);
				user.setCreateDate(new Date());
				user.setUpdateDate(new Date());
				user.setLastLogin(new Date());
				//user.setFollows(new ArrayList<String>(0));
			}
			user.setLastLogin(new Date());
			Datastore.put(user);

			this.loginUser = collectUserInfo(user);
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
		UserModel user = getTwitterUser(name);
		if (user == null) {
			twitter4j.User tuser = twitter.showUser(twitter.getId());
			user = new UserModel();
			user.setTwitterUser(name);
			user.setNickname(tuser.getName());
			user.setProvider(TWITTER);
			user.setPhotoUrl(tuser.getProfileImageURL().toExternalForm());
			user.setCreateDate(new Date());
			user.setUpdateDate(new Date());
			user.setAutoTwit(true);
		}
		user.setLastLogin(new Date());
		Datastore.put(user);
		this.loginUser = collectUserInfo(user);
		redirect("/");
		return;
	}

	private UserModel collectUserInfo(UserModel user) {
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

	private HashMap<Long,UserModel> cacheUserModel = new HashMap<Long,UserModel>();
	private UserModel getUserModel(Long id) {
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
	private UserModel getGoogleUser(String name) {
		UserModelMeta e = UserModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.googleUser.equal(name));
		List<UserModel> list = q.asList();
		if (list.size() == 0) return null;
		return list.get(0);
	}
	private UserModel getTwitterUser(String name) {
		UserModelMeta e = UserModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.twitterUser.equal(name));
		List<UserModel> list = q.asList();
		if (list.size() == 0) return null;
		return list.get(0);
	}

	
	public UserModel getUserModelPublic(Long id) {
		UserModel user = getUserModel(id);
		// TODO: 非公開データをマスク。
		return user;
	}
	public  void writeUser(Map map) throws Exception {
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
		
		if (this.loginUser != null 
				&& this.loginUser.getUserId() == id) {
			this.loginUser = collectUserInfo(user);
		}
	}
	
//------------------------------------------------------------------------------
	private void twit(String msg) throws Exception {
		if (twitter == null) {
			LOG.warning("not twit");
			return;
		}
		twitter4j.Status stat = twitter.updateStatus(msg);
	}
	
	
	public List<Long> getMyImageIds() {
		ImageModelMeta e = ImageModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.userId.equal(loginUser.getUserId()));
		q.sort(e.createDate.desc);
		List<Long> list = new ArrayList(16);
		Iterator<Key> ite = q.asKeyIterator();
		while (ite.hasNext()) {
			list.add(Long.valueOf(ite.next().getId()));
		}
		return list;
	}

	public  String writeImage(MultiPartMap params) {
		FileItem fileItem = params.toFileItem("file");
		if (fileItem == null || fileItem.getData().length == 0) {
			return "";
		}
		byte[] data = ImageLogic.getInstance().toThumbnail(fileItem.getData(), 128);

		
		ImageModel img = new ImageModel();
		img.setUserId(loginUser.getUserId());
		img.setContentType("image/jpeg");
		img.setFileName(fileItem.getFileName());
		img.setCreateDate(new Date());
		img.setOriginUrl(null);
		img.setData(data);
		Key imgKey = Datastore.put(img);
		return ""+imgKey.getId();
	}

	public  String writeImageOrigin(String url) throws IOException {
		byte[] data = ImageLogic.getInstance().toThumbnail(url, 128);
		
		ImageModel img = new ImageModel();
		img.setUserId(loginUser.getUserId());
		img.setContentType("image/jpeg");
		img.setFileName(null);
		img.setCreateDate(new Date());
		img.setOriginUrl(url);
		img.setData(data);
		Key imgKey = Datastore.put(img);
		return ""+imgKey.getId();
	}

	
	
	
	public  Long writeSpot(Map map) {
		Params params = new Params(map);
System.out.println("--->"+map);
		//String imgKey = writeImage(params);

		SpotModel model = null;
		Long id = params.toLong("id");
		if (id != null) {
			Key key = Datastore.createKey(SpotModel.class, id);
			model = Datastore.get(SpotModel.class, key);
		} else {
			model = new SpotModel();
		}

		model.setName(params.toString("name"));
		model.setFurikana(params.toString("furikana"));
		model.setCreateDate(new Date());
		model.setUpdateDate(new Date());
		model.setLat(params.toDouble("lat"));
		model.setLng(params.toDouble("lng"));
		model.setAreas(toAreaList(model.getLat(), model.getLng()));
		model.setAddress(params.toString("address"));
		model.setTags((List<String>)map.get("tags"));
		model.setImage(params.toString("image"));
		model.setComment(params.toString("comment"));
		model.setClosedDay(params.toString("closedDay"));
		model.setTimeLunchMin(params.toString("timeLunchMin"));
		model.setTimeLunchMax(params.toString("timeLunchMax"));
		model.setTimeDinnerMin(params.toString("timeDinnerMin"));
		model.setTimeDinnerMax(params.toString("timeDinnerMax"));
		model.setEmail(params.toString("email"));
		model.setUrl(params.toString("url"));
		//model.setImage(imgKey);

		// for Dummy data
		Float appraise = params.toFloat("appraise");
		if (appraise != null) {
			model.setAppraise(appraise);
		}
		
		Key key = Datastore.put(model);

		return key.getId();
	}


	public  Long writeMemo(Map map) {
		Params params = new Params(map);

		MemoModel model = null;
		Long id = params.toLong("id");
		if (id != null) {
			Key key = Datastore.createKey(MemoModel.class, id);
			model = Datastore.get(MemoModel.class, key);
		} else {
			model = new MemoModel();
		}

		List<String> images = new ArrayList<String>(1);
		images.add(params.toString("image"));

		model.setUsername(null); // TODO:
		model.setCreateDate(new Date());
		model.setUpdateDate(new Date());
		model.setLat(params.toDouble("lat"));
		model.setLng(params.toDouble("lng"));
		model.setAreas(toAreaList(model.getLat(), model.getLng()));
		model.setAddress(params.toString("address"));
		model.setAppraise(params.toInteger("appraise"));
		model.setTags(Arrays.asList(params.toString("tags").split(",")));
		model.setComment(params.toString("comment"));
		model.setImages(images);
		model.setPublish(params.toBoolean("publish"));
		model.setTested(params.toBoolean("tested"));
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
		Long id = params.toLong("id");
		if (id != null) {
			Key key = Datastore.createKey(ReviewModel.class, id);
			model = Datastore.get(ReviewModel.class, key);
		} else {
			model = new ReviewModel();
		}

		List<String> images = new ArrayList<String>(1);
		images.add(params.toString("image"));

		model.setUserId(user.getUserId());
		model.setNickname(user.getNickname());
		model.setSpotId(params.toLong("spotId"));
		model.setSpotName(params.toString("spotName"));
		model.setSpotKana(params.toString("spotKana"));
		model.setArea(toArea(params.toDouble("lat"),params.toDouble("lng")));
		model.setCreateDate(new Date());
		model.setUpdateDate(new Date());
		model.setAppraise(params.toFloat("appraise"));
		model.setComment(params.toString("comment"));
		model.setPhotoUrl(params.toString("photoUrl"));
		Key key = Datastore.put(model);

		twit(params.toString("comment")+"@"+params.toString("name"));

		return key.getId();
	}



	private  List<String> toAreaList(double lat, double lng) {
		// 100K
		int lat0 = (int)Math.floor(lat);
		int lng0 = (int)Math.floor(lng);
		// 10K
		double lat1 = Math.floor(lat*10)/10;
		double lng1 = Math.floor(lng*10)/10;
		// 1K
		double lat2 = Math.floor(lat*100)/100;
		double lng2 = Math.floor(lng*100)/100;
		// 100m
		double lat3 = Math.floor(lat*1000)/1000;
		double lng3 = Math.floor(lng*1000)/1000;
		// 10m
		double lat4 = Math.floor(lat*10000)/10000;
		double lng4 = Math.floor(lng*10000)/10000;
		
		List<String> list = Arrays.asList(
			String.format("%03d,%03d", lat0, lng0),
			String.format("%05.1f,%05.1f", lat1, lng1),
			String.format("%06.2f,%06.2f", lat2, lng2),
			String.format("%07.3f,%07.3f", lat3, lng3),
			String.format("%08.4f,%08.4f", lat4, lng4)
		);
		return list;
	}

	private String toArea(double lat, double lng) {
		// 1K
		double lat2 = Math.floor(lat*100)/100;
		double lng2 = Math.floor(lng*100)/100;
		return String.format("%06.2f,%06.2f", lat2, lng2);
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
/*--- move client
	public  List<String> getAreas(Map map){
		Params params = new Params(map);
		double minLat =  params.toDouble("minLat");
		double minLng =  params.toDouble("minLng");
		double maxLat =  params.toDouble("maxLat");
		double maxLng =  params.toDouble("maxLng");

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
---*/
	public SpotModel getSpot(Long id){
		try {
			Key key = Datastore.createKey(SpotModel.class, id);
			SpotModel model = Datastore.get(SpotModel.class, key);
			return model;
		} catch (EntityNotFoundRuntimeException e) {
			return null;
		}
	}
	public List<SpotModel> getSpots(Map map){
		Params params = new Params(map);
		double latMin =  params.toDouble("latMin");
		double lngMin =  params.toDouble("lngMin");
		double latMax =  params.toDouble("latMax");
		double lngMax =  params.toDouble("lngMax");
		Integer limit = params.toInteger("limit");
		List<String> areas = (List<String>) params.get("areas");
		String tag = params.toString("tag");

		SpotModelMeta e = SpotModelMeta.get();
		Iterator<SpotModel>[] qs = new Iterator[areas.size()];
		for (int i=0; i<qs.length; i++) {
			ModelQuery q = Datastore.query(e);
			q.filter(e.areas.in(areas.get(i)));
			q.sort(e.appraise.desc);
			if (tag != null) q.filter(e.tags.in(tag));
			qs[i] = q.asIterator();
		}
		
		SpotModel[] spots = new SpotModel[qs.length];
		for (int i=0; i<qs.length; i++) {
			while (spots[i] == null && qs[i].hasNext()) {
				spots[i] = qs[i].next();
				if (!inBounds(spots[i],latMin,lngMin,latMax,lngMax)) {
					spots[i] = null;
				}
			}
		}

		List<SpotModel> list = new ArrayList<SpotModel>(limit);
		for (int i=0; i<limit; i++) {
			int maxJ = -1;
			float maxA = -10000.0F;
			for (int j=0; j<spots.length; j++) {
				if (spots[j] != null && spots[j].getAppraise() > maxA) {
					maxJ = j;
					maxA = spots[j].getAppraise();
				}
			}
			if (maxJ == -1) break;
			list.add(spots[maxJ]);
			spots[maxJ] = null;
			while (spots[maxJ] == null && qs[maxJ].hasNext()) {
				spots[maxJ] = qs[maxJ].next();
				if (!inBounds(spots[maxJ],latMin,lngMin,latMax,lngMax)) {
					spots[maxJ] = null;
				}
			}
		}
		
		System.out.println("spots="+list.size()+"\n"+params);

		return list;
	}

	private boolean inBounds(SpotModel spot, double latMin, double lngMin,
			double latMax, double lngMax) {
		double lat = spot.getLat();
		double lng = spot.getLng();
		return latMin<=lat && lat<=latMax && lngMin<=lng && lng<=lngMax;
	}
	
	public  List<AreaSpotBean> listSpot(Map map){
		Params params = new Params(map);
		//String area = params.toString("area");
		List<String> areas = (List<String>) params.get("areas");
		String tag = params.toString("tag");
		Integer limit = params.toInteger("limit");
		Integer range = params.toInteger("range");

		List<AreaSpotBean> result = new ArrayList<AreaSpotBean>(areas.size());
		SpotModelMeta e = SpotModelMeta.get();
		for (String area : areas) {
			if (area == null) continue; // ignore null.

			ModelQuery q = Datastore.query(e);
			q.filter(e.areas.in(area));
			q.sort(e.appraise.desc);
			if (tag != null) q.filter(e.tags.in(tag));
			if (limit != null) q.limit(limit);
			List<SpotModel> list = q.asList();

			result.add(new AreaSpotBean(area, list));
		}

		System.out.println("listSpot:"+areas);
		return result;
	}

	public  List<MemoModel> listMemo(Map map){
		Params params = new Params(map);
		String area = params.toString("area");

		MemoModelMeta e = MemoModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.areas.in(area));
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
		return collectReviewModels(list);
	}
	
	public  List<ReviewModel> listTimeline(Map map){
System.out.println("listTimeline:"+map);
		Params params = new Params(map);
		String tag = params.toString("tag");
		Long userId = params.toLong("userId");
		Integer limit = params.toInteger("limit");
		Double lat =  params.toDouble("lat");
		Double lng =  params.toDouble("lng");
		List<Long> follows = (List<Long>)params.get("follows");

		ReviewModelMeta e = ReviewModelMeta.get();
		if (lat == null && follows == null) {
			ModelQuery q = Datastore.query(e);
			if (tag != null) q.filter(e.tags.in(tag));
			if (userId != null) q.filter(e.userId.equal(userId));
			q.sort(e.updateDate.desc);
			if (limit != null) q.limit(limit);
			List<ReviewModel> list = q.asList();
			System.out.println("review=" + list);
			return collectReviewModels(list);
		} else if (lat != null && follows == null) {
			return listTimeline(params, lat, lng, limit);
		} else if (lat == null && follows != null) {
			return listTimeline(params, follows, limit);
		} else if (lat != null && follows != null) {
			return listTimeline(params, lat, lng, follows, limit);
		}
		return null; // error
	}
	private List<ReviewModel> listTimeline(Params params, 
			Double lat, Double lng, List<Long> follows, 
			Integer limit) {
		String tag = params.toString("tag");
		List<String> areas = getAreas5km(lat,lng);

		ReviewModelMeta e = ReviewModelMeta.get();
		Iterator<ReviewModel>[] qs = new Iterator[areas.size()*follows.size()];
		for (int i=0; i<areas.size(); i++) {
			for (int j=0; j<follows.size(); j++) {
				ModelQuery q = Datastore.query(e);
				q.filter(e.area.equal(areas.get(i)));
				q.filter(e.userId.equal(follows.get(j)));
				if (tag != null) q.filter(e.tags.in(tag));
				q.sort(e.updateDate.desc);
				qs[i] = q.asIterator();
			}
		}
		return listTimeline(params,qs, limit);
	}
	
	private List<ReviewModel> listTimeline(Params params, 
			Double lat, Double lng,
			Integer limit) {

		String tag = params.toString("tag");
		List<String> areas = getAreas5km(lat,lng);
		
		ReviewModelMeta e = ReviewModelMeta.get();
		Iterator<ReviewModel>[] qs = new Iterator[areas.size()];
		for (int i=0; i<qs.length; i++) {
			ModelQuery q = Datastore.query(e);
			q.filter(e.area.equal(areas.get(i)));
			if (tag != null) q.filter(e.tags.in(tag));
			q.sort(e.updateDate.desc);
			qs[i] = q.asIterator();
		}
		return listTimeline(params, qs, limit);
	}
	
	private List<String> getAreas5km(Double lat, Double lng) {
		double latMin = lat - 0.025;
		double lngMin = lng - 0.025;
		double latMax = lat + 0.025;
		double lngMax = lng + 0.025;

		List<String> areas = new ArrayList<String>(36);
		for (double _lat=latMin; _lat<latMax; _lat+=0.01) {
			for (double _lng=lngMin; _lng<lngMax; _lng+=0.01) {
				areas.add(toArea(_lat,_lng));
			}
		}
		
		return areas;
	}
	
	private List<ReviewModel> listTimeline(Params params, 
			List<Long> follows, Integer limit) {
		
		String tag = params.toString("tag");

		ReviewModelMeta e = ReviewModelMeta.get();
		Iterator<ReviewModel>[] qs = new Iterator[follows.size()];
		for (int i=0; i<qs.length; i++) {
			ModelQuery q = Datastore.query(e);
			q.filter(e.userId.equal(follows.get(i)));
			if (tag != null) q.filter(e.tags.in(tag));
			q.sort(e.updateDate.desc);
			qs[i] = q.asIterator();
		}
		return listTimeline(params, qs, limit);
	}
	private List<ReviewModel> listTimeline(Params params, Iterator<ReviewModel>[] qs, Integer limit) {
		String search = params.toString("search");
		
		ReviewModel[] models = new ReviewModel[qs.length];
		for (int i=0; i<qs.length; i++) {
			while (models[i] == null && qs[i].hasNext()) {
				models[i] = qs[i].next();
				if (search != null 
						&& ! isMatch(models[i].getSpotName(), search)
						&& ! isMatch(models[i].getSpotKana(), search)
				) {
						models[i] = null;
				}
			}
		}

		List<ReviewModel> list = new ArrayList<ReviewModel>(limit);
		for (int i=0; i<limit; i++) {
			int maxJ = -1;
			long maxA = 0L;
			for (int j=0; j<models.length; j++) {
				if (models[j] != null && models[j].getUpdateDate().getTime() > maxA) {
					maxJ = j;
					maxA = models[j].getUpdateDate().getTime();
				}
			}
			if (maxJ == -1) break;
			list.add(models[maxJ]);
			models[maxJ] = null;
			while (models[maxJ] == null && qs[maxJ].hasNext()) {
				models[maxJ] = qs[maxJ].next();
				if (search != null 
					&& ! isMatch(models[maxJ].getSpotName(), search)
					&& ! isMatch(models[maxJ].getSpotKana(), search)
				) {
					models[maxJ] = null;
				}
			}
		}
		return collectReviewModels(list);
	}

	private List<ReviewModel> collectReviewModels(List<ReviewModel> list) {
		for (ReviewModel model : list) {
			UserModel user = getUserModel(model.getUserId());
			model.setNickname(user.getNickname());
			model.setUserPhotoUrl(user.getPhotoUrl());
		}
		return list;
	}
	
	
	private static boolean isMatch(String target, String where) {
		System.out.println("isMatch:"+target+","+where);
		if (target == null) return false;
		return target.indexOf(where) >= 0; 
	}
	
	
	public  void deleteDummyData(){
		SpotModelMeta e = SpotModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.address.equal("ダミー"));
		List<Key> list = q.asKeyList();
		Datastore.delete(list);
		System.out.println("delete dummy");
	}

	
	public String getKana(String kanji) throws IOException {
		return KakasiLogic.getInstance().toKana(kanji);
	}
}
