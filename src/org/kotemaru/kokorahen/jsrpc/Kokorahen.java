package org.kotemaru.kokorahen.jsrpc;

import java.io.IOException;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slim3.datastore.*;

import org.kotemaru.jsrpc.JsrpcEnvironment;
import org.kotemaru.jsrpc.JsrpcException;
import org.kotemaru.jsrpc.Params;
import org.kotemaru.jsrpc.annotation.JsRpc;
import org.kotemaru.kokorahen.logic.KakasiLogic;
import org.kotemaru.kokorahen.logic.ReviewLogic;
import org.kotemaru.kokorahen.logic.SpotLogic;
import org.kotemaru.kokorahen.logic.TimelineLogic;
import org.kotemaru.kokorahen.logic.TwitterLogic;
import org.kotemaru.kokorahen.logic.UserLogic;
import org.kotemaru.kokorahen.meta.SpotModelMeta;
import org.kotemaru.kokorahen.model.ReviewModel;
import org.kotemaru.kokorahen.model.SpotModel;
import org.kotemaru.kokorahen.model.UserModel;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;


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

	public transient UserLogic userLogic = UserLogic.getInstance(this);
	public transient SpotLogic spotLogic = SpotLogic.getInstance(this);
	public transient ReviewLogic reviewLogic = ReviewLogic.getInstance(this);
	public transient TimelineLogic timelineLogic = TimelineLogic.getInstance(this);
	public TwitterLogic twitterLogic = TwitterLogic.getInstance(this);

	private UserModel loginUser;

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
	// ログイン処理

	public  UserModel getLoginUser() {
System.out.println("getLoginUser:"+loginUser+":"+getSession(false).getId());
		return loginUser;
	}
	private void checkLogin() throws JsrpcException {
		if (loginUser == null) {
			throw new JsrpcException("Not login.");
		}
	}
	private void checkLogin(Long id) throws JsrpcException {
		checkLogin();
		if (loginUser.getUserId() != id) {
			throw new JsrpcException("Not you.");
		}
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
			UserModel user = userLogic.getGoogleUser(name, true);
			userLogic.lastLogin(user);
			user.setProvider(GOOGLE);
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
		String callback = url+ BASE_PATH+".twitterCallback";
		String loginUrl = twitterLogic.login(callback);
		return loginUrl;
	}

	public  void twitterCallback() throws Exception {
		String verifier = request.getParameter("oauth_verifier");
		if (twitterLogic.verify(verifier) == false) {
			LOG.warning("Not twitter login");
			getSession(true).invalidate();
			redirect("/");
			return;
		}

		String name = twitterLogic.getScreenName();
		UserModel user = userLogic.getTwitterUser(name, true);
		userLogic.lastLogin(user);
		this.loginUser = user;
		user.setProvider(TWITTER);
		redirect("/");
		return;
	}

	public  String logout(String provider) throws Exception {
		this.loginUser = null;
		getSession(true).invalidate();
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


	//------------------------------------------------------------------------------
	// ユーザ管理
	
	public UserModel getUserModelPublic(Long id) {
		UserModel user = userLogic.getUserModel(id);
		// TODO: 非公開データをマスク。
		return user;
	}
	public  void writeUser(Map map) throws Exception {
		Params params = new Params(map);
		checkLogin(params.toLong("userId"));
		this.loginUser = userLogic.writeUser(map);
		this.loginUser.setProvider(params.toString("provider"));
	}
	
	//------------------------------------------------------------------------------
	// Spot管理
	public SpotModel getSpot(Long id){
		return spotLogic.getSpot(id);
	}
	public List<SpotModel> getSpots(Map map){
		return spotLogic.listSpot(map);
	}
	public  Long writeSpot(Map map) {
		checkLogin();
		return spotLogic.writeSpot(map);
	}
	public String getKana(String kanji) throws IOException {
		return KakasiLogic.getInstance().toKana(kanji);
	}

	//------------------------------------------------------------------------------
	// Review管理
	public  List<ReviewModel> listReview(long spotId){
		return reviewLogic.listReview(spotId);
	}

	public  Long writeReview(Map map) throws Exception {
		checkLogin();
		return reviewLogic.writeReview(map);
	}

	public  List<ReviewModel> listTimeline(Map map){
		return reviewLogic.collectReviewModels(timelineLogic.listTimeline(map));
	}

	//------------------------------------------------------------------------------
	// デバッグ
	public  void deleteDummyData(){
		SpotModelMeta e = SpotModelMeta.get();
		ModelQuery q = Datastore.query(e);
		q.filter(e.address.equal("ダミー"));
		List<Key> list = q.asKeyList();
		Datastore.delete(list);
		System.out.println("delete dummy");
	}

}
