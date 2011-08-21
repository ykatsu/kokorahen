package org.kotemaru.kokorahen.jsrpc;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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

@JsRpc()
public class Kokorahen {

	public static Map getUsername(String mode, String url) throws IOException {
		//Params params = new Params(map);

		String username = null;
		String nickname = null;
		String loginUrl = null;
		String logoutUrl = null;
		//String mode = params.getString("mode");
		if ("google".equals(mode)) {
			UserService us = UserServiceFactory.getUserService();
			User user = us.getCurrentUser();
			if (user != null) {
				username = user.getEmail();
				nickname = user.getNickname();
			}
			loginUrl = us.createLoginURL(url);
			logoutUrl = us.createLogoutURL(url);
		} else {
			throw new RuntimeException("Not implements");
		}

		Map result = new HashMap();
		result.put("username", username);
		result.put("nickname", nickname);
		result.put("loginUrl", loginUrl);
		result.put("logoutUrl", logoutUrl);
		return result;
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
	public static Long writeReview(Map map) {
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
