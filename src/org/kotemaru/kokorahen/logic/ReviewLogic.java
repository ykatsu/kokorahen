package org.kotemaru.kokorahen.logic;

import java.util.*;
import java.util.logging.Logger;
import org.slim3.datastore.*;
import org.kotemaru.jsrpc.Params;
import org.kotemaru.kokorahen.jsrpc.Kokorahen;
import org.kotemaru.kokorahen.meta.MemoModelMeta;
import org.kotemaru.kokorahen.meta.ReviewModelMeta;
import org.kotemaru.kokorahen.meta.SpotModelMeta;
import org.kotemaru.kokorahen.meta.UserModelMeta;
import org.kotemaru.kokorahen.model.MemoModel;
import org.kotemaru.kokorahen.model.ReviewModel;
import org.kotemaru.kokorahen.model.SpotModel;
import org.kotemaru.kokorahen.model.UserModel;

import twitter4j.TwitterException;

import com.google.appengine.api.datastore.Key;


public class ReviewLogic  {
	private static final long serialVersionUID = 1L;
	private static final Logger LOG = Logger.getLogger(ReviewLogic.class.getName());

	private Kokorahen env;
	
	private ReviewLogic(Kokorahen env) {
		this.env = env;
	}
	
	public static ReviewLogic getInstance(Kokorahen env) {
		return new ReviewLogic(env);
	}
	
	public ReviewModel getReviewModel(Long id) throws Exception {
		if (id == null) return null;
		try {
			Key key = Datastore.createKey(ReviewModel.class, id);
			ReviewModel model = Datastore.get(ReviewModel.class, key);
			return model;
		} catch (EntityNotFoundRuntimeException e) {
			return null;
		}
	}
	public  Long writeReview(Map map) throws Exception {
		Params params = new Params(map);

		Long id = params.toLong("id");
		ReviewModel model = getReviewModel(id);
		if (id == null) {
			model = new ReviewModel();
		}

		UserModel user = env.getLoginUser();
		
		List<String> images = new ArrayList<String>(1);
		images.add(params.toString("image"));

		model.setUserId(user.getUserId());
		model.setNickname(user.getNickname());
		model.setSpotId(params.toLong("spotId"));
		model.setSpotName(params.toString("spotName"));
		model.setSpotKana(params.toString("spotKana"));
		model.setArea(SpotLogic.toArea(params.toDouble("lat"),params.toDouble("lng")));
		model.setCreateDate(new Date());
		model.setUpdateDate(new Date());
		model.setAppraise(params.toFloat("appraise"));
		model.setComment(params.toString("comment"));
		model.setPhotoUrl(params.toString("photoUrl"));
		Key key = Datastore.put(model);

		env.twitterLogic.twit(params.toString("comment")+"@"+params.toString("name"));

		return key.getId();
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
	
	public List<ReviewModel> collectReviewModels(List<ReviewModel> list) {
		for (ReviewModel model : list) {
			UserModel user = env.userLogic.getUserModel(model.getUserId());
			model.setNickname(user.getNickname());
			model.setUserPhotoUrl(user.getPhotoUrl());
		}
		return list;
	}

}
