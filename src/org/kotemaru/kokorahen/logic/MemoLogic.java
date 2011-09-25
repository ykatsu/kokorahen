package org.kotemaru.kokorahen.logic;

import java.util.*;
import java.util.logging.Logger;
import org.slim3.datastore.*;
import org.kotemaru.jsrpc.Params;
import org.kotemaru.kokorahen.jsrpc.Kokorahen;
import org.kotemaru.kokorahen.meta.MemoModelMeta;
import org.kotemaru.kokorahen.meta.UserModelMeta;
import org.kotemaru.kokorahen.model.MemoModel;
import org.kotemaru.kokorahen.model.UserModel;

import twitter4j.TwitterException;

import com.google.appengine.api.datastore.Key;


public class MemoLogic  {
	private static final long serialVersionUID = 1L;
	private static final Logger LOG = Logger.getLogger(MemoLogic.class.getName());

	private Kokorahen env;
	private HashMap<Long,UserModel> cacheUserModel = new HashMap<Long,UserModel>();

	private MemoLogic(Kokorahen env) {
		this.env = env;
	}
	
	public static MemoLogic getInstance(Kokorahen env) {
		return new MemoLogic(env);
	}
/*
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
*/
}
